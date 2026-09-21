const { Prisma } = await import('@prisma/client');
const names = ['Product','Course','Module','Lesson','Exercise','Attachment','Enrollment','LessonProgress','Certificate'];
for (const m of Prisma.dmmf.datamodel.models.filter(x => names.includes(x.name))) {
  console.log('MODEL ' + m.name);
  for (const f of m.fields) console.log('  ' + f.name + ' : ' + f.type + (f.isRequired ? '' : '?') + (f.relationName ? ' rel=' + f.relationName : ''));
}
