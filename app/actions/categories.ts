"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function createCategory(data: {
  name: string;
  color: string;
  icon?: string;
}) {
  const category = await prisma.category.create({
    data,
  });

  revalidatePath("/settings");
  revalidatePath("/expenses");

  return category;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    color?: string;
    icon?: string;
  }
) {
  const category = await prisma.category.update({
    where: { id },
    data,
  });

  revalidatePath("/settings");
  revalidatePath("/expenses");

  return category;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({
    where: { id },
  });

  revalidatePath("/settings");
  revalidatePath("/expenses");
}

