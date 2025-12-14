export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  birthMonth: string;
  over18: boolean;
  phone: string;
  contactMethod: "call" | "text" | "email";
}
