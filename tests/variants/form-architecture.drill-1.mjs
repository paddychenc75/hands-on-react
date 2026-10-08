const HEAD = `import { useForm, Controller, useController } from 'react-hook-form';

const api = { save(data) { return new Promise((r) => setTimeout(r, 200)); } };

function StarRating({ value = 0, onChange }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} aria-label={n + ' 星'} aria-pressed={n <= value} onClick={() => onChange(n)}>
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </span>
  );
}
`;
const form = body => `${HEAD}
function App() {
  const { control, register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ defaultValues: { rating: 0, note: '' } });
${body}
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码（register 展开到自定义组件）', code: '$starter', expect: 'fail', match: /评分是 0 时不应调用|请先打分|4 颗星/ },
  {
    name: '错误 A：用了 Controller，但没有把 field.onChange 交给组件，星星不亮',
    expect: 'fail',
    match: /4 颗星亮起/,
    code: form(`  return (
    <form onSubmit={handleSubmit((data) => api.save(data))}>
      <Controller name="rating" control={control} rules={{ min: { value: 1, message: '请先打分' } }}
        render={({ field, fieldState }) => (<div>评分 <StarRating value={field.value} onChange={() => {}} /><small>{fieldState.error?.message}</small></div>)} />
      <input placeholder="备注" {...register('note')} />
      <button>提交</button>
    </form>
  );`),
  },
  {
    name: '错误 B：Controller 接对了，但没写校验规则，评分 0 也能提交',
    expect: 'fail',
    match: /评分是 0 时不应调用/,
    code: form(`  return (
    <form onSubmit={handleSubmit((data) => api.save(data))}>
      <Controller name="rating" control={control}
        render={({ field, fieldState }) => (<div>评分 <StarRating value={field.value} onChange={field.onChange} /><small>{fieldState.error?.message}</small></div>)} />
      <input placeholder="备注" {...register('note')} />
      <button>提交</button>
    </form>
  );`),
  },
  {
    name: '错误 C：用 useState 保存评分，没有写进表单，提交的 rating 一直是 0',
    expect: 'fail',
    match: /评分是 0 时不应调用/,
    code:
      `import { useState } from 'react';\n` +
      form(`  const [stars, setStars] = useState(0);
  return (
    <form onSubmit={handleSubmit((data) => api.save(data))}>
      <div>评分 <StarRating value={stars} onChange={setStars} /><small>{errors.rating?.message}</small></div>
      <input placeholder="备注" {...register('note')} />
      <button>提交</button>
    </form>
  );`).replace(
        "import { useForm, Controller, useController } from 'react-hook-form';",
        "import { useForm, Controller, useController } from 'react-hook-form';",
      ),
  },
  {
    name: '不同写法：useController 封装成 RatingField 组件，用 validate 函数校验',
    expect: 'pass',
    code: `${HEAD}
function RatingField({ control }) {
  const { field, fieldState } = useController({ name: 'rating', control, rules: { validate: (v) => v >= 1 || '请先打分' } });
  return (<div>评分 <StarRating value={field.value} onChange={field.onChange} /><small>{fieldState.error?.message}</small></div>);
}
function App() {
  const { control, register, handleSubmit } = useForm({ defaultValues: { rating: 0, note: '' } });
  return (
    <form onSubmit={handleSubmit(async (data) => { await api.save(data); })}>
      <RatingField control={control} />
      <input placeholder="备注" {...register('note')} />
      <button>提交</button>
    </form>
  );
}`,
  },
];
