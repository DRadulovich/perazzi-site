import { groq } from "next-sanity";

export const buildConfiguratorQuery = groq`*[_type == "buildConfigurator"][0]{
  FRAME_SIZE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  PLATFORM[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  DISCIPLINE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  MODEL[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  TRIGGER_TYPE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  GRADE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  ENGRAVING[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  ACTION_FINISH[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  GAUGE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  LENGTH[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  WEIGHT[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  CHOKE_TYPE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  B1_CHOKE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  B2_CHOKE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  CHAMBER_LENGTH[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BORE_DIAMETER[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  MONOBLOC[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  SIDERIBS_LENGTH[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  SIDERIBS_VENTILATION[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BEAD_FRONT[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BEAD_FRONT_COLOR[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BEAD_FRONT_STYLE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  BEAD_MID[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_TYPE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_HEIGHT[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_STYLE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_TRAMLINE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_TRAMLINE_SIZE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  RIB_TAPER_12[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  TRIGGER_GROUP_SPRINGS[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  TRIGGER_GROUP_SELECTIVE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  TRIGGER_GROUP_SAFETY[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  WOOD_UPGRADE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  FOREND_SHAPE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  FOREND_CHECKER[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
  STOCK_PROFILE[]->{..., stepId, optionValue, description, platform, discipline, grade, gauge, trigger, side, order, image},
}`;

export const platformQuery = groq`*[
  _type == "platform" && (
    name match $term ||
    name match $altTerm ||
    name match $compactTerm ||
    name match $looseTerm ||
    slug.current match $term ||
    slug.current match $altTerm ||
    slug.current match $compactTerm ||
    slug.current match $looseTerm
  )
]{
  _id,
  "title": name,
  "description": lineage,
  "image": hero.asset
}[0...5]`;

export const modelQuery = groq`*[
  _type == "allModels" && (
    name match $term ||
    name match $altTerm ||
    name match $compactTerm ||
    name match $looseTerm ||
    slug.current match $term ||
    slug.current match $altTerm ||
    slug.current match $compactTerm ||
    slug.current match $looseTerm ||
    baseModel match $term ||
    baseModel match $altTerm ||
    baseModel match $compactTerm ||
    baseModel match $looseTerm
  )
]{
  _id,
  "title": name,
  "platform": platform->name,
  "gauges": gauges,
  "triggerTypes": trigger.type ? [trigger.type] : [],
  "grade": grade->name,
  "image": coalesce(image.asset, null)
}[0...5]`;

export const disciplineQuery = groq`*[_type == "discipline" && (name match $term || slug.current match $term)]{
  _id,
  "title": name,
  overview,
  "recommendedPlatforms": recommendedPlatforms[]->name,
  "popularModels": []
}[0...5]`;

export const gaugeQuery = groq`*[_type == "gauge" && (name match $term || name match $altTerm || name match $compactTerm || name match $looseTerm)]{
  _id,
  "title": name,
  "description": handlingNotes
}[0...5]`;

export const gradeQuery = groq`*[
  _type == "grade" && (
    name match $term ||
    name match $altTerm ||
    name match $compactTerm ||
    name match $looseTerm
  )
]{
  _id,
  "title": name,
  "description": description,
  "image": hero.asset
}[0...5]`;

export const modelGradeQuery = groq`*[
  _type == "allModels" && (
    name match $modelTerm ||
    name match $altModelTerm ||
    name match $compactModelTerm ||
    name match $looseModelTerm ||
    slug.current match $modelTerm ||
    slug.current match $altModelTerm ||
    slug.current match $compactModelTerm ||
    slug.current match $looseModelTerm
  )
][0...3]{
  "grade": grade->name
}`;

export const platformFallback = groq`*[_type == "platform"] | order(name asc)[0...10]{
  _id,
  "title": name,
  "description": lineage,
  "image": hero.asset
}`;

export const modelFallback = groq`*[
  _type == "allModels" && (
    lower(name) == $lowerValue ||
    name match $looseTerm ||
    slug.current match $looseTerm ||
    lower(baseModel) == $lowerValue
  )
][0...10]{
  _id,
  "title": name,
  "platform": platform->name,
  "gauges": gauges,
  "triggerTypes": trigger.type ? [trigger.type] : [],
  "grade": grade->name,
  "image": coalesce(image.asset, null)
}`;

export const disciplineFallback = groq`*[
  _type == "discipline" && (
    lower(name) == $lowerValue ||
    name match $looseTerm ||
    slug.current match $looseTerm
  )
][0...10]{
  _id,
  "title": name,
  overview,
  "recommendedPlatforms": recommendedPlatforms[]->name,
  "popularModels": []
}`;

export const gaugeFallback = groq`*[
  _type == "gauge" && (
    lower(name) == $lowerValue ||
    name match $looseTerm
  )
][0...10]{
  _id,
  "title": name,
  "description": handlingNotes
}`;

export const gradeFallback = groq`*[
  _type == "grade" && (
    lower(name) == $lowerValue ||
    name match $looseTerm
  )
][0...10]{
  _id,
  "title": name,
  "description": description,
  "image": hero.asset
}`;

export const triggerTypeQuery = groq`*[
  _type == "allModels" && (
    trigger.type match $term ||
    trigger.type match $altTerm ||
    trigger.type match $compactTerm ||
    trigger.type match $looseTerm
  )
]{
  _id,
  "title": name,
  "platform": platform->name,
  "triggerTypes": trigger.type ? [trigger.type] : [],
  "image": coalesce(image.asset, null)
}[0...5]`;
