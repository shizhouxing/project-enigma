import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Game } from '@/types/game';

interface GameSettingsProps {
  game: Game;
}

export function GameSettings({ game }: GameSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Temperature</p>
            <p className="text-sm text-gray-600">
              {game.metadata.model_config.temperature}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Max Tokens</p>
            <p className="text-sm text-gray-600">
              {game.metadata.model_config.max_tokens}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Tools Enabled</p>
            <p className="text-sm text-gray-600">
              {game.metadata.model_config.tools_config.enabled ? 'Yes' : 'No'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Time Limit</p>
            <p className="text-sm text-gray-600">
              {game.metadata.game_rules.timed 
                ? `${game.metadata.game_rules.time_limit / 1000}s` 
                : 'No limit'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}