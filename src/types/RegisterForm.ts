export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  birthMonth: string;
  over18: boolean;
  phone: string;
  contactMethod: "call" | "text" | "email";
}
