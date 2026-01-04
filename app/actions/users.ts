"use server";

import { prisma } from "@/lib/prisma";

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: { name: string; avatar?: string }) {
  return await prisma.user.create({
    data,
  });
}

export async function updateUser(
  id: string,
  data: { name?: string; avatar?: string }
) {
  return await prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  });
}

