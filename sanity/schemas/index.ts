import { article } from "./article";
import { blockContent } from "./blockContent";
import { champion } from "./champion";
import { discipline } from "./discipline";
import { factoryAsset } from "./factoryAsset";
import { gauge } from "./gauge";
import { grade } from "./grade";
import { heritageEvent } from "./heritageEvent";
import { recommendedServiceCenter } from "./recommendedServiceCenter";
import { authorizedDealer } from "./authorizedDealer";
import { manufactureYear } from "./manufactureYear";
import { scheduledEvent } from "./scheduledEvent";
import { platform } from "./platform";
import { siteSettings } from "./siteSettings";
import { imageWithMeta } from "./objects/imageWithMeta";
import { homeSingleton } from "./documents/homeSingleton";
import { shotgunsLanding } from "./documents/shotgunsLanding";
import { bespokeHome } from "./documents/bespokeHome";
import { experienceHome } from "./documents/experienceHome";
import { heritageEraConfig, heritageHome } from "./documents/heritageHome";
import { serviceHome } from "./documents/serviceHome";
import { journalLanding } from "./documents/journalLanding";
import { author } from "./documents/author";
import { engravings } from "./documents/engravings";
import { allModels } from "./documents/allModels";
import { buildConfigurator } from "./documents/buildConfigurator";
import { configuratorSidebarCard } from "./documents/configuratorSidebarCard";

export const schemaTypes = [
  // Objects first so they’re available to documents
  imageWithMeta,
  heritageEraConfig,

  // Existing documents
  blockContent,
  platform,
  discipline,
  champion,
  authorizedDealer,
  recommendedServiceCenter,
  manufactureYear,
  scheduledEvent,
  heritageEvent,
  factoryAsset,
  grade,
  gauge,
  article,
  siteSettings,

  // NEW documents
  homeSingleton,
  shotgunsLanding,
  bespokeHome,
  experienceHome,
  heritageHome,
  serviceHome,
  journalLanding,
  author,
  engravings,
  allModels,
  buildConfigurator,
  configuratorSidebarCard,
];
