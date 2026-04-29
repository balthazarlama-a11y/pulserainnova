import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Sign up | CalmBand"
};

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
