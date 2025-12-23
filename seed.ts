import { faker } from "@faker-js/faker";

import { prisma } from "./lib/prisma";

async function main() {
  // Create genres first
  const genreNames = [
    "Fiction",
    "Non-Fiction",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Thriller",
    "Romance",
    "Horror",
    "Biography",
    "History",
  ];

  const genres = await Promise.all(
      genreNames.map((name) =>
          prisma.genre.create({
            data: { name },
          })
      )
  );

  console.log("Created genres:", genres);

  // Create publishers
  const publishers = await Promise.all(
      Array.from({ length: 3 }, () =>
          prisma.publisher.create({
            data: {
              name: faker.company.name(),
            },
          })
      )
  );

  console.log("Created publishers:", publishers);

  // Create authors with books that have genres
  for (const publisher of publishers) {
    // Randomly select 2-3 genres for each book
    const randomGenres = faker.helpers.arrayElements(
        genres,
        faker.number.int({ min: 1, max: 3 })
    );

    const author = await prisma.author.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        books: {
          create: [
            {
              title: faker.book.title(),
              publisherId: publisher.id,
              genres: {
                connect: randomGenres.map((genre) => ({ id: genre.id })),
              },
            },
            {
              title: faker.book.title(),
              publisherId: publisher.id,
              genres: {
                connect: faker.helpers
                    .arrayElements(genres, faker.number.int({ min: 1, max: 3 }))
                    .map((genre) => ({ id: genre.id })),
              },
            },
          ],
        },
      },
      include: {
        books: {
          include: {
            genres: true,
          },
        },
      },
    });

    console.log("Created author:", author);
  }
}

main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });