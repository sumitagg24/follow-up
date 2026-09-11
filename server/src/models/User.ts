import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: unknown;
  updatedAt: unknown;
}

interface IUserMethods {
  verifyPassword(plain: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

/** Hash the password whenever a plain password is assigned (user.password = "plain"). */
UserSchema.virtual("password")
  .set(function (plain: string) {
    (this as any)._plainPassword = plain;
  })
  .get(function () {
    return (this as any)._plainPassword;
  });

UserSchema.pre("validate", async function () {
  const self = this as any;
  if (self._plainPassword) {
    self.passwordHash = await bcrypt.hash(self._plainPassword, 10);
    self._plainPassword = undefined;
  }
});

UserSchema.methods.verifyPassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

/** Never leak the hash in JSON output. */
UserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc: unknown, ret: any) => {
    delete ret.passwordHash;
    delete ret.password;
    delete ret._plainPassword;
    return ret;
  },
});

export const User = mongoose.model<IUser, UserModel>("User", UserSchema);
