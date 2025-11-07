import { article } from "./article";
import { blockContent } from "./blockContent";
import { champion } from "./champion";
import { discipline } from "./discipline";
import { factoryAsset } from "./factoryAsset";
import { gauge } from "./gauge";
import { grade } from "./grade";
import { heritageEvent } from "./heritageEvent";
import { platform } from "./platform";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [
  blockContent,
  platform,
  discipline,
  champion,
  heritageEvent,
  factoryAsset,
  grade,
  gauge,
  article,
  siteSettings,
];
