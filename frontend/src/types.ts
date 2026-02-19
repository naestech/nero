export type Vote = {
  id: string;
  songId: string;
  participantId: string;
  value: number;
  updatedAt: string;
};

export type Song = {
  id: string;
  partyId: string;
  itunesId: string;
  title: string;
  artist: string;
  albumArt: string;
  previewUrl: string;
  addedByName: string;
  position: number;
  status: string;
  playedAt: string | null;
  votes: Vote[];
};

export type Participant = {
  id: string;
  partyId: string;
  name: string;
  isHost: boolean;
  socketId: string | null;
  joinedAt: string;
};

export type Party = {
  id: string;
  name: string;
  theme: string;
  status: string;
  hostId: string;
  createdAt: string;
  idleTimeout: number;
  participants: Participant[];
  songs: Song[];
};

export type CurrentSong = {
  songId: string;
  startTime: number;
};

export type Reveal = {
  songId: string;
  score: number;
  votes: Vote[];
};

export type SearchResult = {
  itunesId: string;
  title: string;
  artist: string;
  albumArt: string;
  previewUrl: string;
};

export type ResultEntry = {
  song: Song;
  yesPercent: number;
  total: number;
};
