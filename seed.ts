import { faker } from "@faker-js/faker";
import { prisma } from "./lib/prisma";


// simpler to edit :)
const SEED_CONFIG = {
  genres: 12,
  publishers: 5,
  authors: 10,
  booksPerAuthor: { min: 1, max: 3 },
  genresPerBook: { min: 1, max: 3 },
  users: 15,
  reviewsPerUser: { min: 67, max: 76 },
  ratingRange: { min: 3, max: 5 },
};

async function seedGenres() {
  const genres = await Promise.all(
      Array.from({ length: SEED_CONFIG.genres }, () =>
          prisma.genre.create({
            data: { name: faker.book.genre() },
          })
      )
  );

  console.log(`Seeded ${genres.length} genres`);
  return genres;
}

async function seedPublishers() {
  const publishers = await Promise.all(
      Array.from({ length: SEED_CONFIG.publishers }, () =>
          prisma.publisher.create({
            data: {
              name: `${faker.company.name()} Publishing`,
            },
          })
      )
  );

  console.log(`Seeded ${publishers.length} publishers`);
  return publishers;
}

async function seedAuthorsAndBooks(publishers: any[], genres: any[]) {
  const allBooks = [];

  for (let i = 0; i < SEED_CONFIG.authors; i++) {
    const randomPublisher = faker.helpers.arrayElement(publishers);
    const randomGenres = faker.helpers.arrayElements(
        genres,
        faker.number.int(SEED_CONFIG.genresPerBook)
    );

    const author = await prisma.author.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        books: {
          create: Array.from(
              { length: faker.number.int(SEED_CONFIG.booksPerAuthor) },
              () => ({
                title: faker.book.title(),
                publisherId: randomPublisher.id,
                genres: {
                  connect: randomGenres.map((genre) => ({ id: genre.id })),
                },
              })
          ),
        },
      },
      include: {
        books: true,
      },
    });

    allBooks.push(...author.books);
  }

  console.log(`Seeded ${SEED_CONFIG.authors} authors with ${allBooks.length} books`);
  return allBooks;
}

async function seedUsers() {
  const users = await Promise.all(
      Array.from({ length: SEED_CONFIG.users }, () => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        return prisma.user.create({
          data: {
            username: faker.internet.username({ firstName, lastName }),
            email: faker.internet.email({ firstName, lastName }),
            password: faker.internet.password(),
            first_name: firstName,
            last_name: lastName,
            nick_name: faker.helpers.maybe(() => faker.internet.displayName(), {
              probability: 0.5,
            }),
            mfa_enabled: faker.datatype.boolean(),
            dob: faker.date.birthdate({ min: 18, max: 80, mode: "age" }),
          },
        });
      })
  );

  console.log(`Seeded ${users.length} users`);
  return users;
}

async function seedReviews(users: any[], books: any[]) {
  let successCount = 0;
  let skipCount = 0;

  for (const user of users) {
    const numReviews = faker.number.int(SEED_CONFIG.reviewsPerUser);
    const booksToReview = faker.helpers.arrayElements(books, numReviews);

    for (const book of booksToReview) {
      try {
        await prisma.userReviews.create({
          data: {
            userId: user.id,
            bookId: book.id,
            rating: faker.number.float({
              ...SEED_CONFIG.ratingRange,
              fractionDigits: 1,
            }),
            reviewBody: faker.helpers.maybe(
                () => faker.lorem.paragraph({ min: 1, max: 3 }),
                { probability: 0.8 }
            ),
          },
        });
        successCount++;
      } catch (error) {
        skipCount++;
      }
    }
  }

  console.log(`Seeded ${successCount} reviews (${skipCount} duplicates skipped)`);
}

async function main() {
  console.log("Starting database seed...\n");

  const genres = await seedGenres();
  const publishers = await seedPublishers();
  const books = await seedAuthorsAndBooks(publishers, genres);
  const users = await seedUsers();
  await seedReviews(users, books);

  console.log("\nSeed completed successfully");
}

main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error("Seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });