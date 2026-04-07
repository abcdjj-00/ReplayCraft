import { replayCraftPlayerSettingsDB } from "../../classes/subscriptions/world-initialize";
import { PlayerSettings } from "../../classes/types/types";

export function setDefaultPlayerSettings(playerId: string) {
    const defaultSettings: PlayerSettings = {
        entityRecording: true,
        multiplayerRecording: true,
    };
    replayCraftPlayerSettingsDB.set(playerId, defaultSettings);
}
