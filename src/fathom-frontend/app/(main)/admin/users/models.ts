export interface UserVM {
  id: string;
  name: string | null;
  email: string;
  designation: string | null;
  role: "admin" | "crew";
}
