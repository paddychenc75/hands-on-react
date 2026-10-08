const API = `const api = { save(data) { return new Promise((r) => setTimeout(r, 200)); } };`;
const IMPORTS = `import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
`;
const UI = `
function App() {
  const { register, handleSubmit, formState: { errors } } = useForm({ RESOLVER mode: 'onTouched' });
  return (
    <form noValidate onSubmit={handleSubmit((data) => api.save(data))}>
      <div><input placeholder="邮箱" {...register('email')} /> <small>{errors.email?.message}</small></div>
      <div><input type="password" placeholder="密码" {...register('password')} /> <small>{errors.password?.message}</small></div>
      <div><input type="password" placeholder="确认密码" {...register('confirm')} /> <small>{errors.confirm?.message}</small></div>
      <button>注册</button>
    </form>
  );
}`;
const make = (schema, resolver = 'resolver: zodResolver(signupSchema),', imports = IMPORTS) =>
  `${imports}\n${API}\n${schema}\n${UI.replace('RESOLVER', resolver)}`;
const GOOD = `const signupSchema = z.object({
  email: z.email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位'),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: '两次密码不一致', path: ['confirm'] });`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /邮箱格式不正确|signupSchema/ },
  {
    name: '错误 A：refine 没写 path，错误挂不到 confirm 字段',
    expect: 'fail',
    match: /挂在 confirm 字段上/,
    code: make(GOOD.replace(", path: ['confirm']", '')),
  },
  {
    name: '错误 B：schema 写对了，但没把 zodResolver 传给 useForm',
    expect: 'fail',
    match: /zodResolver/,
    code: make(GOOD, ''),
  },
  {
    name: '错误 C：邮箱只用 z.string()，没有格式规则',
    expect: 'fail',
    match: /邮箱格式不正确/,
    code: make(GOOD.replace("z.email('邮箱格式不正确')", 'z.string()')),
  },
  {
    name: '不同写法：import * as z，z.string().email 旧写法（已弃用但可用），password 用 .min 链式，refine 用 error',
    expect: 'pass',
    code: make(
      `const signupSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位'),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { error: '两次密码不一致', path: ['confirm'] });`,
      'resolver: zodResolver(signupSchema),',
      IMPORTS.replace("import { z } from 'zod';", "import * as z from 'zod';"),
    ),
  },
];
