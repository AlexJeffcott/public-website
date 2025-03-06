import { type FunctionalComponent } from 'preact'
import classes from '@/pages/home/home.module.css'
import {
  NavigateToCodeBtn,
  NavigateToFSBtn,
  NavigateToGenImgBtn,
  ToggleColorThemeBtn,
  ToggleThemeBtn,
} from '@/actions-ui/mod.ts'

export const HomePage: FunctionalComponent = () => {
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
          <NavigateToFSBtn />
        </nav>
      </div>
      <footer class={classes.footer}>Alex Jeffcott</footer>
    </main>
  )
}
