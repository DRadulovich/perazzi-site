export const getGradeAnchorId = (grade: { id?: string; name?: string }) => {
  const source = (grade.id || grade.name || "grade")
    .toString()
    .trim()
    .toLowerCase();
  const slug = source
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `grade-${slug || "series"}`;
};
