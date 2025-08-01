import {store} from "~/.server/db/store";
import bcrypt from "bcrypt";
import {v4 as uuidv4} from "uuid";

export type User = {
  id: string;
  username: string;
};


interface Credentials {
  username: string;
  password: string;
}

export async function validateCredentials(credentials: Credentials): Promise<User> {
  const { username, password } = credentials;

  const user = await store.users.getUser(credentials.username);

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new Error("Invalid username or password");
  }

  // Careful, it should not return the user object as it contains the password field
  return {
    id: user.id,
    username: user.username,
  };
}

export async function createUser(credentials: Credentials): Promise<User> {
  const { username, password } = credentials;

  const existingUser = await store.users.getUser(username);
  if (existingUser) {
    throw new Response("User already exists", { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const id = uuidv4();

  const user = await store.users.createUser({id, username, password: hashedPassword});

  // Careful, it should not return the user object as it contains the password field
  return {
    id: user.id,
    username: user.username,
  };
}