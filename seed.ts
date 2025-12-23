import { faker } from "@faker-js/faker";
import { prisma } from "./lib/prisma";

async function main() {
  console.log("----Starting seed-----");

  // Create genres first
  console.log("-Creating genres...");
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
    "Self-Help",
    "Adventure",
  ];

  const genres = await Promise.all(
      genreNames.map((name) =>
          prisma.genre.create({
            data: { name },
          })
      )
  );

  console.log(`✅ Created ${genres.length} genres`);

  // Create publishers
  console.log("🏢 Creating publishers...");
  const publishers = await Promise.all(
      Array.from({ length: 5 }, () =>
          prisma.publisher.create({
            data: {
              name: faker.company.name() + " Publishing",
            },
          })
      )
  );

  console.log(`✅ Created ${publishers.length} publishers`);

  // Create authors with books
  console.log("✍️ Creating authors and books...");
  const books = [];

  for (let i = 0; i < 10; i++) {
    const randomPublisher = faker.helpers.arrayElement(publishers);
    const randomGenres = faker.helpers.arrayElements(
        genres,
        faker.number.int({ min: 1, max: 3 })
    );

    const author = await prisma.author.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        books: {
          create: Array.from(
              { length: faker.number.int({ min: 1, max: 3 }) },
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

    books.push(...author.books);
    console.log(`  ✅ Created author: ${author.name} with ${author.books.length} book(s)`);
  }

  console.log(`✅ Created ${books.length} total books`);


  const users = await Promise.all(
      Array.from({ length: 15 }, (_) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        return prisma.user.create({
          data: {
            username: faker.internet.username({ firstName, lastName }),
            email: faker.internet.email({ firstName, lastName }),
            password: faker.internet.password(),
            first_name: firstName,
            last_name: lastName,
            nick_name: faker.helpers.maybe(() => faker.internet.displayName(), { probability: 0.5 }),
            mfa_enabled: faker.datatype.boolean(),
            dob: faker.date.birthdate({ min: 18, max: 80, mode: "age" }),
          },
        });
      })
  );

  console.log(`✅ Created ${users.length} users`);

  // Create reviews
  console.log("⭐ Creating reviews...");
  let reviewCount = 0;

  for (const user of users) {
    // Each user reviews 3-8 random books
    const numReviews = faker.number.int({ min: 67, max: 76 });
    const booksToReview = faker.helpers.arrayElements(books, numReviews);

    for (const book of booksToReview) {
      try {
        await prisma.userReviews.create({
          data: {
            userId: user.id,
            bookId: book.id,
            rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
            reviewBody: faker.helpers.maybe(
                () => faker.lorem.paragraph({ min: 1, max: 3 }),
                { probability: 0.8 }
            ),
          },
        });
        reviewCount++;
      } catch (error) {
        // Skip if duplicate review (user already reviewed this book)
        console.log(error);
      }
    }
  }

  console.log(`Created ${reviewCount} reviews`);
  console.log("\nSeed completed successfully!");
}

main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("Seed failed idk why check the error message:", e);
      await prisma.$disconnect();
      process.exit(1);
    });