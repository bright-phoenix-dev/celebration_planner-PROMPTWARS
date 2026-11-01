'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Lightbulb, UtensilsCrossed, Music, Mail, Palette, Loader2 } from 'lucide-react';
import { useAIIdeas } from '@/hooks/useAIIdeas';
import { useEventStore } from '@/store/eventStore';
import type { AIPreferences } from '@/types';

/**
 * Ideas tab: preferences form + AI-generated celebration ideas.
 */
export function IdeasTab() {
  const currentEvent = useEventStore((s) => s.currentEvent);
  const { ideas, isLoading, error, fetchIdeas, clearIdeas } = useAIIdeas();

  const [theme, setTheme] = useState('');
  const [cultureTradition, setCultureTradition] = useState('');
  const [dietaryNeeds, setDietaryNeeds] = useState('');
  const [venueType, setVenueType] = useState('');
  const [vibe, setVibe] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;

    const preferences: AIPreferences = {
      eventType: currentEvent.type,
      theme: theme.trim() || undefined,
      cultureTradition: cultureTradition.trim() || undefined,
      dietaryNeeds: dietaryNeeds.trim() || undefined,
      venueType: venueType.trim() || undefined,
      vibe: vibe.trim() || undefined,
      budget: currentEvent.totalBudget,
      guestCount: currentEvent.guestCount,
    };

    void fetchIdeas(preferences);
  };

  return (
    <div className="space-y-6">
      {/* Preferences form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            Get AI-Powered Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ai-theme">Theme / Style</Label>
                <Input
                  id="ai-theme"
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value);
                  }}
                  placeholder="e.g. Rustic barn, Modern minimalist"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-vibe">Desired Vibe</Label>
                <Input
                  id="ai-vibe"
                  value={vibe}
                  onChange={(e) => {
                    setVibe(e.target.value);
                  }}
                  placeholder="e.g. Elegant, Fun & casual, Romantic"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-venue">Venue Type</Label>
                <Input
                  id="ai-venue"
                  value={venueType}
                  onChange={(e) => {
                    setVenueType(e.target.value);
                  }}
                  placeholder="e.g. Outdoor garden, Hotel ballroom"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-culture">Culture / Traditions</Label>
                <Input
                  id="ai-culture"
                  value={cultureTradition}
                  onChange={(e) => {
                    setCultureTradition(e.target.value);
                  }}
                  placeholder="e.g. Indian wedding, Jewish celebration"
                  maxLength={300}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-dietary">Dietary Needs</Label>
              <Textarea
                id="ai-dietary"
                value={dietaryNeeds}
                onChange={(e) => {
                  setDietaryNeeds(e.target.value);
                }}
                placeholder="e.g. Vegetarian, Gluten-free, Halal, Nut-free options"
                maxLength={300}
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                    Generate Ideas
                  </>
                )}
              </Button>
              {ideas && (
                <Button type="button" variant="outline" onClick={clearIdeas}>
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {isLoading && (
        <div aria-live="polite" aria-busy="true" className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/50" role="alert">
          <CardContent className="p-4 text-destructive">
            <p className="font-medium">Failed to generate ideas</p>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {ideas && !isLoading && (
        <div className="space-y-4" aria-live="polite">
          {/* Themes */}
          {ideas.themes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-accent" aria-hidden="true" />
                  Theme Ideas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {ideas.themes.map((t, i) => (
                    <li key={i} className="rounded-md bg-muted/50 p-3">
                      <p className="font-medium">{t.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Decor */}
          {ideas.decor.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-accent" aria-hidden="true" />
                  Decoration Ideas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {ideas.decor.map((d, i) => (
                    <li key={i} className="rounded-md bg-muted/50 p-2 text-sm">
                      {d}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Menu */}
          {ideas.menu.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UtensilsCrossed className="h-4 w-4 text-accent" aria-hidden="true" />
                  Menu Ideas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {ideas.menu.map((m, i) => (
                    <li key={i} className="rounded-md bg-muted/50 p-2 text-sm">
                      <span className="font-medium">{m.item}</span>
                      {m.note && <span className="ml-2 text-muted-foreground">— {m.note}</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Activities */}
          {ideas.activities.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Music className="h-4 w-4 text-accent" aria-hidden="true" />
                  Activities &amp; Entertainment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {ideas.activities.map((a, i) => (
                    <li key={i} className="rounded-md bg-muted/50 p-2 text-sm">
                      {a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Invitations */}
          {ideas.invitations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                  Invitation Ideas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {ideas.invitations.map((inv, i) => (
                    <li key={i} className="rounded-md bg-muted/50 p-3">
                      <p className="font-medium">{inv.style}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{inv.description}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
