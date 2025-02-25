import { type FunctionComponent } from 'preact'
import classes from '@/pages/home/home.module.css'
import {
  NavigateToCodeBtn,
  NavigateToGenImgBtn,
  ToggleColorThemeBtn,
  ToggleThemeBtn,
} from '@/actions-ui/mod.ts'

export const HomePage: FunctionComponent = () => {
  return (
    <main class={classes.page}>
      <header class={classes.header}>
        <div></div>
        <ToggleThemeBtn />
        <ToggleColorThemeBtn />
      </header>
      <div class={classes.content}>
        <h1>Welcome</h1>
        <nav class={classes.nav}>
          <NavigateToCodeBtn />
          <NavigateToGenImgBtn />
        </nav>
      </div>
      <footer class={classes.footer}>Alex Jeffcott</footer>
    </main>
  )
}
