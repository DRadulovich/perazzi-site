export const getGradeAnchorId = (grade: { id?: string; name?: string }) => {
  const source = (grade.id || grade.name || "grade")
    .toString()
    .trim()
    .toLowerCase();
  const slug = source
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/(^-)|(-$)/g, "");

  return `grade-${slug || "series"}`;
};
