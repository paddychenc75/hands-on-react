/* ========== 后加的课：插到指定课程之后，不打乱原有文件 ========== */
const lessonAfter = (afterId, o) => {
  const i = LESSONS.findIndex(l => l.id === afterId);
  LESSONS.splice(i < 0 ? LESSONS.length : i + 1, 0, o);
};
