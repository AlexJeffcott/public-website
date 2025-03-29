import { type FunctionalComponent } from 'preact'
import classes from '@/pages/home/home.module.css'
import {
  NavigateToEditImgBtn,
  NavigateToFSBtn,
  NavigateToGenImgBtn,
  SetColorThemeInput,
} from '@/actions-ui/mod.ts'

export const HomePage: FunctionalComponent = () => {
  return (
    <main class={classes.page}>
      <header class={classes.header}>
        <div></div>
        <SetColorThemeInput />
      </header>
      <div class={classes.content}>
        <h1>Welcome</h1>
        <nav class={classes.nav}>
          <NavigateToGenImgBtn />
          <NavigateToEditImgBtn />
          <NavigateToFSBtn />
        </nav>
      </div>
      <footer class={classes.footer}>Alex Jeffcott</footer>
    </main>
  )
}
