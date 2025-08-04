import { store } from "app/.server/db/operations";
import bcrypt from "bcrypt";

export type User = {
  id: string;
  email: string;
  name: string;
};

interface Credentials {
  email: string;
  password: string;
}

export async function validateCredentials(
  credentials: Credentials,
): Promise<User> {
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
