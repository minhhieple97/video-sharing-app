import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Create a random user
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: await argon2.hash('password1234'),
    },
  });

  Logger.log(`Created user with id: ${user.id}`);

  // Array of real YouTube video IDs and titles
  const youtubeVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
    { id: 'jNQXAC9IVRw', title: 'Me at the zoo' },
    { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee' },
    { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You' },
    { id: 'OPf0YbXqDm0', title: 'Mark Ronson - Uptown Funk ft. Bruno Mars' },
    {
      id: 'RgKAFK5djSk',
      title: 'Wiz Khalifa - See You Again ft. Charlie Puth',
    },
    { id: 'fJ9rUzIMcZQ', title: 'Queen - Bohemian Rhapsody (Official Video)' },
    { id: 'CevxZvSJLk8', title: 'Katy Perry - Roar (Official)' },
    { id: 'YQHsXMglC9A', title: 'Adele - Hello' },
    {
      id: 'pRpeEdMmmQ0',
      title:
        'Shakira - Waka Waka (This Time for Africa) (The Official 2010 FIFA World Cup™ Song)',
    },
    { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE(강남스타일) M/V' },
    { id: 'hT_nvWreIhg', title: 'OneRepublic - Counting Stars' },
    { id: 'JRfuAukYTKg', title: 'Taylor Swift - Shake It Off' },
    { id: 'nfWlot6h_JM', title: 'Taylor Swift - Blank Space' },
    { id: 'YqeW9_5kURI', title: 'Justin Bieber - Baby ft. Ludacris' },
    { id: 'KYniUCGPGLs', title: 'Eminem - Not Afraid' },
    {
      id: 'lp-EO5I60KA',
      title: 'Ed Sheeran - Thinking Out Loud [Official Video]',
    },
    {
      id: 'PT2_F-1esPk',
      title: 'The Chainsmokers - Closer (Lyric) ft. Halsey',
    },
    { id: 'RBumgq5yVrA', title: 'Passenger | Let Her Go (Official Video)' },
    {
      id: 'aJOTlE1K90k',
      title: 'Maroon 5 - Girls Like You ft. Cardi B (Official Music Video)',
    },
  ];

  // Generate video records
  const videoPromises = youtubeVideos.map((video) =>
    prisma.video.create({
      data: {
        youtubeId: video.id,
        title: video.title,
        sharedBy: user.id,
      },
    }),
  );

  const videos = await Promise.all(videoPromises);

  Logger.log(`Created ${videos.length} video records`);
}

main()
  .catch((e) => {
    Logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
