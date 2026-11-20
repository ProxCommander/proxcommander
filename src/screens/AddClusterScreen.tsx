import { KeyRound, Plus, Server, X, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { describePolicy } from '@/lib/format';
import type { AuthMethod } from '@/models';
import { normalizeEndpointUrl } from '@/proxmox/client';
import { DEFAULT_SESSION_POLICY, SESSION_PRESETS, type SessionPresetName } from '@/session/policy';
import { useSessions } from '@/session/sessions';
import { addCluster, addLogin, REMEMBER_BY_DEFAULT } from '@/state/profiles';
import { canStoreLongLivedSecrets, isWeb } from '@/storage/backends';

const PRESET_NAMES = Object.keys(SESSION_PRESETS) as SessionPresetName[];
const DEFAULT_PRESET =
  PRESET_NAMES.find((name) => SESSION_PRESETS[name] === DEFAULT_SESSION_POLICY) ?? 'standard';
const presetLabel = (name: SessionPresetName) =>
  `${name[0].toUpperCase()}${name.slice(1)} — ${describePolicy(SESSION_PRESETS[name])}`;

function endpointProblem(value: string): string | null {
  if (!value.trim()) return 'Enter a hostname or address';
  try {
    normalizeEndpointUrl(value);
    return null;
  } catch (error) {
    return error instanceof Error && error.message.includes('https') ? error.message : 'Not a valid address';
  }
}

interface AddClusterScreenProps {
  onCancel: () => void;
  onCreated: (loginId: string) => void;
}

export function AddClusterScreen({ onCancel, onCreated }: AddClusterScreenProps) {
  const [name, setName] = useState('');
  const [endpoints, setEndpoints] = useState(['']);
  const [rememberHostnames, setRememberHostnames] = useState(REMEMBER_BY_DEFAULT);
  const [username, setUsername] = useState('root');
  const [realm, setRealm] = useState('pam');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [tokenName, setTokenName] = useState('');
  const [rememberUsername, setRememberUsername] = useState(REMEMBER_BY_DEFAULT);
  const [rememberSecret, setRememberSecret] = useState(false);
  const [preset, setPreset] = useState<SessionPresetName>(DEFAULT_PRESET);
  const [submitted, setSubmitted] = useState(false);
  // Saving before stored profiles load would race their restore (e.g. on a reload of this page).
  const ready = useSessions((state) => state.hydrated);

  const problems = {
    name: name.trim() ? null : 'Give the cluster a name',
    endpoints: endpoints.map(endpointProblem),
    username: username.trim() ? null : 'Enter a username',
    realm: realm.trim() ? null : 'Enter a realm',
    tokenName: authMethod === 'token' && !tokenName.trim() ? 'Enter the token name' : null,
  };
  const valid =
    !problems.name && problems.endpoints.every((p) => !p) && !problems.username && !problems.realm && !problems.tokenName;

  const save = () => {
    setSubmitted(true);
    if (!valid || !ready) return;
    const cluster = addCluster({
      name: name.trim(),
      kind: 'pve',
      endpoints: endpoints.map((url) => ({ url })),
      rememberHostnames,
    });
    const login = addLogin({
      clusterId: cluster.id,
      username: username.trim(),
      realm: realm.trim(),
      authMethod,
      tokenName: authMethod === 'token' ? tokenName.trim() : undefined,
      rememberUsername: rememberHostnames && rememberUsername,
      rememberSecret: canStoreLongLivedSecrets && rememberSecret,
      sessionPolicy: SESSION_PRESETS[preset],
    });
    onCreated(login.id);
  };

  const show = (problem: string | null) => (submitted ? problem : null);

  return (
    <View className="flex-1">
      <ScreenHeader title="Add cluster" onBack={onCancel} />

      <ScrollView
        contentContainerClassName="w-full max-w-xl gap-4 self-center p-4 pb-10 sm:pt-8"
        keyboardShouldPersistTaps="handled"
        // iOS: insets the content above the keyboard and scrolls the focused field into view.
        automaticallyAdjustKeyboardInsets>
        <Card className="gap-5 px-4 py-5 sm:px-6">
          <CardTitle icon={Server} title="Cluster" />
          <Field label="Name" error={show(problems.name)}>
            <Input value={name} onChangeText={setName} placeholder="Homelab" />
          </Field>

          <View className="gap-1.5">
            <Label>Addresses</Label>
            <Text className="text-muted-foreground text-xs">
              Any node of the cluster. Tried in order; the first that answers is used.
            </Text>
            {endpoints.map((value, index) => (
              <View key={index} className="gap-1">
                <View className="flex-row items-center gap-2">
                  <Input
                    className="flex-1"
                    value={value}
                    onChangeText={(text) => setEndpoints((list) => list.map((v, i) => (i === index ? text : v)))}
                    placeholder="pve1.example.lan or 10.0.0.5:8006"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  {endpoints.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      accessibilityLabel="Remove address"
                      onPress={() => setEndpoints((list) => list.filter((_, i) => i !== index))}>
                      <Icon as={X} className="size-4" />
                    </Button>
                  ) : null}
                </View>
                <EndpointHint value={value} error={show(problems.endpoints[index])} />
              </View>
            ))}
            <Button variant="outline" size="sm" className="self-start" onPress={() => setEndpoints((list) => [...list, ''])}>
              <Icon as={Plus} className="size-4" />
              <Text>Add address</Text>
            </Button>
          </View>

          <SwitchRow
            label="Remember hostnames"
            hint={isWeb ? 'Saved in this browser. Off: forgotten when the page reloads.' : 'Saved on this device.'}
            checked={rememberHostnames}
            onCheckedChange={setRememberHostnames}
          />
        </Card>

        <Card className="gap-5 px-4 py-5 sm:px-6">
          <CardTitle icon={KeyRound} title="Login" />
          <View className="flex-row gap-3">
            <Field label="Username" error={show(problems.username)} className="flex-1">
              <Input value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
            </Field>
            <Field label="Realm" error={show(problems.realm)} className="w-28">
              <Input value={realm} onChangeText={setRealm} autoCapitalize="none" autoCorrect={false} />
            </Field>
          </View>

          <View className="gap-1.5">
            <Label>Authentication</Label>
            <View role="radiogroup" aria-label="Authentication" className="bg-muted flex-row gap-1 self-start rounded-lg p-1">
              {(['password', 'token'] as const).map((method) => (
                <Button
                  key={method}
                  size="sm"
                  variant="ghost"
                  role="radio"
                  aria-checked={authMethod === method}
                  className={authMethod === method ? 'bg-control-selected shadow-sm shadow-black/10' : undefined}
                  onPress={() => setAuthMethod(method)}>
                  <Text className={authMethod === method ? 'text-foreground' : 'text-muted-foreground'}>
                    {method === 'password' ? 'Password' : 'API token'}
                  </Text>
                </Button>
              ))}
            </View>
          </View>

          {authMethod === 'token' ? (
            <Field label="Token name" error={show(problems.tokenName)}>
              <Input value={tokenName} onChangeText={setTokenName} placeholder="proxcommander" autoCapitalize="none" autoCorrect={false} />
            </Field>
          ) : null}

          <SwitchRow
            label="Remember username"
            hint={rememberHostnames ? undefined : 'Needs “Remember hostnames”.'}
            checked={rememberHostnames && rememberUsername}
            disabled={!rememberHostnames}
            onCheckedChange={setRememberUsername}
          />
          {canStoreLongLivedSecrets ? (
            <SwitchRow
              label={authMethod === 'token' ? 'Remember token secret' : 'Remember password'}
              hint="Kept in the device keychain; renews expired sessions automatically."
              checked={rememberSecret}
              onCheckedChange={setRememberSecret}
            />
          ) : (
            <Text className="text-muted-foreground text-xs">
              Passwords and token secrets are never stored in the browser.
            </Text>
          )}

          <View className="gap-1.5">
            <Label>Session rules</Label>
            <Select
              value={{ value: preset, label: presetLabel(preset) }}
              onValueChange={(option) => option && setPreset(option.value as SessionPresetName)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Session rules" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PRESET_NAMES.map((presetName) => (
                    <SelectItem key={presetName} value={presetName} label={presetLabel(presetName)} />
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>
        </Card>

        <View className="flex-row justify-end gap-2 pt-1">
          <Button variant="outline" onPress={onCancel}>
            <Text>Cancel</Text>
          </Button>
          <Button onPress={save} disabled={!ready}>
            <Text>Save and sign in</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

function CardTitle({ icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="bg-muted size-8 items-center justify-center rounded-lg">
        <Icon as={icon} className="text-muted-foreground size-4" />
      </View>
      <Text role="heading" aria-level="2" className="text-base font-semibold">
        {title}
      </Text>
    </View>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string | null; className?: string; children: ReactNode }) {
  return (
    <View className={`gap-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
      {error ? <Text className="text-destructive text-xs">{error}</Text> : null}
    </View>
  );
}

function EndpointHint({ value, error }: { value: string; error: string | null }) {
  if (error) return <Text className="text-destructive text-xs">{error}</Text>;
  if (!value.trim() || endpointProblem(value)) return null;
  return <Text className="text-muted-foreground text-xs">{normalizeEndpointUrl(value)}</Text>;
}

interface SwitchRowProps {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SwitchRow({ label, hint, checked, disabled, onCheckedChange }: SwitchRowProps) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 gap-0.5">
        <Label onPress={() => !disabled && onCheckedChange(!checked)}>{label}</Label>
        {hint ? <Text className="text-muted-foreground text-xs">{hint}</Text> : null}
      </View>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </View>
  );
}
