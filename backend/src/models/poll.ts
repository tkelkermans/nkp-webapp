import { nanoid } from 'nanoid';
import redis, { redisPub } from './redis.js';
import type { Poll, PollOption, CreatePollInput } from '../types/index.js';
import { config } from '../utils/config.js';
// Note: sanitizeString removed - React handles XSS protection automatically

// Clés Redis
const POLL_KEY_PREFIX = 'poll:';
const POLL_VOTES_PREFIX = 'poll:votes:';
const POLL_VOTERS_PREFIX = 'poll:voters:';
const ACTIVE_POLLS_KEY = 'polls:active';

/**
 * Génère un ID unique pour un sondage
 */
function generatePollId(): string {
  return nanoid(10);
}

/**
 * Génère un ID unique pour une option
 */
function generateOptionId(): string {
  return nanoid(8);
}

/**
 * Crée un nouveau sondage
 */
export async function createPoll(input: CreatePollInput): Promise<Poll> {
  const pollId = generatePollId();
  const now = new Date();
  const expiryHours = input.expiryHours ?? config.pollExpiryHours;
  const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

  // Créer les options avec IDs uniques
  const options: PollOption[] = input.options.map((text) => ({
    id: generateOptionId(),
    text: text.trim(),
    votes: 0,
  }));

  const poll: Poll = {
    id: pollId,
    question: input.question.trim(),
    options,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isActive: true,
    totalVotes: 0,
  };

  // Transaction Redis pour garantir l'atomicité
  const pipeline = redis.pipeline();

  // Stocker les données du sondage
  pipeline.hset(`${POLL_KEY_PREFIX}${pollId}`, {
    id: pollId,
    question: poll.question,
    options: JSON.stringify(options),
    createdAt: poll.createdAt,
    expiresAt: poll.expiresAt ?? '',
    isActive: 'true',
  });

  // Initialiser les compteurs de votes
  for (const option of options) {
    pipeline.hset(`${POLL_VOTES_PREFIX}${pollId}`, option.id, '0');
  }

  // Ajouter à la liste des sondages actifs
  pipeline.zadd(ACTIVE_POLLS_KEY, expiresAt.getTime(), pollId);

  // Définir l'expiration
  const ttlSeconds = expiryHours * 60 * 60;
  pipeline.expire(`${POLL_KEY_PREFIX}${pollId}`, ttlSeconds);
  pipeline.expire(`${POLL_VOTES_PREFIX}${pollId}`, ttlSeconds);
  pipeline.expire(`${POLL_VOTERS_PREFIX}${pollId}`, ttlSeconds);

  await pipeline.exec();

  console.log(`✅ Poll created: ${pollId}`);
  return poll;
}

/**
 * Récupère un sondage par son ID
 */
export async function getPollById(pollId: string): Promise<Poll | null> {
  const data = await redis.hgetall(`${POLL_KEY_PREFIX}${pollId}`);

  if (!data || !data['id']) {
    return null;
  }

  // Récupérer les votes actuels
  const votes = await redis.hgetall(`${POLL_VOTES_PREFIX}${pollId}`);

  // Parser les options et ajouter les votes
  const options: PollOption[] = JSON.parse(data['options'] ?? '[]');
  let totalVotes = 0;

  for (const option of options) {
    option.votes = parseInt(votes[option.id] ?? '0', 10);
    totalVotes += option.votes;
  }

  // Vérifier si le sondage a expiré
  const expiresAt = data['expiresAt'];
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const isActive = data['isActive'] === 'true' && !isExpired;

  return {
    id: data['id'],
    question: data['question'] ?? '',
    options,
    createdAt: data['createdAt'] ?? '',
    expiresAt: expiresAt || null,
    isActive,
    totalVotes,
  };
}

/**
 * Récupère tous les sondages actifs
 */
export async function getActivePolls(): Promise<Poll[]> {
  const now = Date.now();

  // Récupérer les IDs des sondages non expirés
  const pollIds = await redis.zrangebyscore(ACTIVE_POLLS_KEY, now, '+inf');

  const polls: Poll[] = [];

  for (const pollId of pollIds) {
    const poll = await getPollById(pollId);
    if (poll && poll.isActive) {
      polls.push(poll);
    }
  }

  return polls;
}

/**
 * Vérifie si un utilisateur a déjà voté
 */
export async function hasVoted(pollId: string, voterId: string): Promise<boolean> {
  const result = await redis.sismember(`${POLL_VOTERS_PREFIX}${pollId}`, voterId);
  return result === 1;
}

/**
 * Enregistre un vote
 */
export async function vote(
  pollId: string,
  optionId: string,
  voterId: string
): Promise<Poll | null> {
  // Vérifier que le sondage existe et est actif
  const poll = await getPollById(pollId);

  if (!poll) {
    throw new Error('Sondage non trouvé');
  }

  if (!poll.isActive) {
    throw new Error('Ce sondage est fermé');
  }

  // Vérifier que l'option existe
  const option = poll.options.find((o) => o.id === optionId);
  if (!option) {
    throw new Error('Option invalide');
  }

  // Vérifier si l'utilisateur a déjà voté
  const alreadyVoted = await hasVoted(pollId, voterId);
  if (alreadyVoted) {
    throw new Error('Vous avez déjà voté pour ce sondage');
  }

  // Transaction atomique pour le vote
  const pipeline = redis.pipeline();

  // Incrémenter le compteur de votes pour l'option
  pipeline.hincrby(`${POLL_VOTES_PREFIX}${pollId}`, optionId, 1);

  // Enregistrer le voteur pour éviter les doublons
  pipeline.sadd(`${POLL_VOTERS_PREFIX}${pollId}`, voterId);

  await pipeline.exec();

  // Récupérer le sondage mis à jour
  const updatedPoll = await getPollById(pollId);

  if (updatedPoll) {
    // Publier la mise à jour via Redis pub/sub
    await redisPub.publish(
      `poll:${pollId}:updates`,
      JSON.stringify(updatedPoll)
    );
    console.log(`✅ Vote recorded: poll=${pollId}, option=${optionId}`);
  }

  return updatedPoll;
}

/**
 * Ferme un sondage
 */
export async function closePoll(pollId: string): Promise<boolean> {
  const exists = await redis.exists(`${POLL_KEY_PREFIX}${pollId}`);

  if (!exists) {
    return false;
  }

  await redis.hset(`${POLL_KEY_PREFIX}${pollId}`, 'isActive', 'false');

  // Publier la fermeture
  await redisPub.publish(`poll:${pollId}:closed`, pollId);

  console.log(`✅ Poll closed: ${pollId}`);
  return true;
}

/**
 * Supprime un sondage
 */
export async function deletePoll(pollId: string): Promise<boolean> {
  const pipeline = redis.pipeline();

  pipeline.del(`${POLL_KEY_PREFIX}${pollId}`);
  pipeline.del(`${POLL_VOTES_PREFIX}${pollId}`);
  pipeline.del(`${POLL_VOTERS_PREFIX}${pollId}`);
  pipeline.zrem(ACTIVE_POLLS_KEY, pollId);

  const results = await pipeline.exec();

  // Vérifier si au moins une clé a été supprimée
  const deleted = results?.some((r) => r[1] && (r[1] as number) > 0) ?? false;

  if (deleted) {
    // Publier la fermeture
    await redisPub.publish(`poll:${pollId}:closed`, pollId);
    console.log(`✅ Poll deleted: ${pollId}`);
  }

  return deleted;
}

/**
 * Nettoie les sondages expirés
 */
export async function cleanupExpiredPolls(): Promise<number> {
  const now = Date.now();

  // Récupérer les sondages expirés
  const expiredIds = await redis.zrangebyscore(ACTIVE_POLLS_KEY, '-inf', now);

  if (expiredIds.length === 0) {
    return 0;
  }

  // Supprimer les sondages expirés
  for (const pollId of expiredIds) {
    await deletePoll(pollId);
  }

  console.log(`🧹 Cleaned up ${expiredIds.length} expired polls`);
  return expiredIds.length;
}
