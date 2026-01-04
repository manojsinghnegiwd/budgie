import { prisma } from "../lib/prisma";

async function main() {
  const defaultCategories = [
    { name: "Food & Dining", color: "#ef4444", icon: "🍔" },
    { name: "Transportation", color: "#3b82f6", icon: "🚗" },
    { name: "Shopping", color: "#8b5cf6", icon: "🛍️" },
    { name: "Entertainment", color: "#ec4899", icon: "🎬" },
    { name: "Bills & Utilities", color: "#f59e0b", icon: "💡" },
    { name: "Healthcare", color: "#10b981", icon: "🏥" },
    { name: "Education", color: "#06b6d4", icon: "📚" },
    { name: "Other", color: "#6b7280", icon: "📦" },
  ];

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log("✅ Seeded default categories");

  // Create sample users
  const users = [
    { name: "Manoj" },
    { name: "Swati" },
  ];

  for (const user of users) {
    const existing = await prisma.user.findFirst({
      where: { name: user.name },
    });
    if (!existing) {
      await prisma.user.create({
        data: user,
      });
    }
  }

  console.log("✅ Seeded sample users");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

