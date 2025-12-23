import { faker } from "@faker-js/faker";

import { prisma } from "./lib/prisma";

async function main() {
  // Create a publisher first
  const publisher = await prisma.publisher.create({
    data: {
      name: faker.company.name(),
    },
  });

  console.log("Created publisher:", publisher);

  // Create an author with a book that references the publisher
  const author = await prisma.author.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      books: {
        create: {
          title: faker.book.title(),
          publisherId: publisher.id,
        },
      },
    },
    include: {
      books: true,
    },
  });

  console.log("Created author:", author);
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