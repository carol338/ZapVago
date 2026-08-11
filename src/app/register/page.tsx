"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { signIn } from "next-auth/react";

const CATEGORIAS = [
  { value: "BARBER", label: "Barbearia" },
  { value: "SALON", label: "Salão de Beleza" },
  { value: "AESTHETIC_CLINIC", label: "Clínica Estética" },
  { value: "MANICURE", label: "Manicure" },
  { value: "DENTAL_CLINIC", label: "Clínica Odontológica" },
  { value: "TATTOO_STUDIO", label: "Estúdio de Tatuagem" },
  { value: "PET_SHOP", label: "Pet Shop" },
  { value: "OTHER", label: "Outro" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    category: "BARBER",
    businessPhone: "",
    ownerName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar conta.");
        setLoading(false);
        return;
      }
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      router.push("/onboarding");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <MessageCircle className="text-zap" size={22} />
          <span className="text-lg font-bold">ZapVago</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="businessName">Nome do negócio</Label>
            <Input id="businessName" required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="businessPhone">WhatsApp do negócio</Label>
            <Input id="businessPhone" placeholder="5511999998888" required value={form.businessPhone} onChange={(e) => setForm({ ...form, businessPhone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="ownerName">Seu nome</Label>
            <Input id="ownerName" required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="text-sm text-risk-high">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground/60">
          Já tem conta? <Link href="/login" className="text-zap-light hover:underline">Entrar</Link>
        </p>
      </Card>
    </main>
  );
}
