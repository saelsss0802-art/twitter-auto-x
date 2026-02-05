export type Account = {
  id: string;
  account_type: string | null;
  status: string | null;
};

export type Persona = {
  id: string;
  account_id: string;
  name: string | null;
  forbidden_words: string[] | null;
};

export type Tweet = {
  id: string;
  account_id: string;
  content: string;
  status: string;
  tweet_type: string | null;
  scheduled_at: string | null;
};

export type TweetInsert = {
  account_id: string;
  content: string;
  status?: string;
  tweet_type?: string | null;
  scheduled_at?: string | null;
};

export type TweetStatusUpdate = {
  status: string;
  updated_at?: string;
};

export type PostingJob = {
  id: string;
  tweet_id: string;
  account_id: string;
  run_at: string;
  status: string;
};

export type PostingJobInsert = {
  tweet_id: string;
  account_id: string;
  run_at: string;
  status?: string;
};
