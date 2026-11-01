import { itemRoute } from "@/server/crud";
import { remindersConfig } from "@/server/resources";

export const { PATCH, DELETE } = itemRoute(remindersConfig);
