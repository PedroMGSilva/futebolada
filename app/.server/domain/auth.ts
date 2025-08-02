import {store} from "~/.server/db/store";
import bcrypt from "bcrypt";
import {v4 as uuidv4} from "uuid";

export type User = {
  id: string;
  email: string;
  name: string;
};


interface Credentials {
  email: string;
  password: string;
}

export async function validateCredentials(credentials: Credentials): Promise<User> {
  const { email, password } = credentials;

  const user = await store.users.getUser(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Careful, it should not return the user object as it contains the password field
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { email, name, password } = input;

  const existingUser = await store.users.getUser(email);
  if (existingUser) {
    throw new Response("User already exists", { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const id = uuidv4();

  const user = await store.users.createUser({id, email, name, password: hashedPassword});

  // Careful, it should not return the user object as it contains the password field
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}