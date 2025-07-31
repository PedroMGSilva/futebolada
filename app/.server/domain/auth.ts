import {getUser} from "~/.server/db/store/usersStore";
import bcrypt from "bcrypt";

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

  const user = await getUser(credentials.username);

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