import { useState, type FormEvent } from 'react';
import { Activity, LogIn, Sparkles, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/shared/context/AuthContext';
import { errorText } from '@/shared/utils/format';

export function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success('Bienvenido a Finanza');
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(name, email, password);
      toast.success('Cuenta creada correctamente');
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDemoLogin() {
    setBusy(true);
    try {
      await login('demo@finanza.local', 'Demo1234!');
      toast.success('Sesión iniciada con cuenta demo');
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </span>
            <span className="text-2xl font-bold tracking-tight">
              finanza<span className="text-primary">.</span>
            </span>
          </div>
          <CardTitle>Control de ingresos, egresos y ahorro</CardTitle>
          <CardDescription>
            Inicia sesión o crea tu cuenta personal para mantener tus datos aislados y seguros.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="login-email">Correo electrónico</FieldLabel>
                    <Input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={busy} className="w-full">
                  <LogIn data-icon="inline-start" />
                  {busy ? 'Ingresando...' : 'Iniciar sesión'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="reg-name">Nombre</FieldLabel>
                    <Input
                      id="reg-name"
                      required
                      minLength={2}
                      maxLength={60}
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="reg-email">Correo electrónico</FieldLabel>
                    <Input
                      id="reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="reg-password">Contraseña</FieldLabel>
                    <Input
                      id="reg-password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <FieldDescription>Mínimo 8 caracteres.</FieldDescription>
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={busy} className="w-full">
                  <UserPlus data-icon="inline-start" />
                  {busy ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative flex items-center py-1">
            <Separator className="flex-1" />
            <span className="px-2 text-xs text-muted-foreground">o prueba en local</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={handleDemoLogin}
            className="w-full"
          >
            <Sparkles data-icon="inline-start" className="text-primary" />
            Entrar con usuario demo (demo@finanza.local)
          </Button>
        </CardContent>

        <CardFooter className="justify-center text-xs text-muted-foreground">
          Sesión protegida mediante cookie httpOnly y aislamiento por usuario.
        </CardFooter>
      </Card>
    </div>
  );
}
