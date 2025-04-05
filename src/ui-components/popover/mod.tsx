import classes from '@/ui-components/popover/popover.module.css'
import { Btn } from '@/ui-components/mod.ts'
import { type FunctionComponent } from '@/types/mod.ts'
import { cls } from '@/utils/mod.ts'
import { useSignal } from '@/hooks/mod.ts'

export const Popover: FunctionComponent<
	{ class?: string; cta: string; id: string }
> = ({ class: className, cta, id, children }) => {
	const showing = useSignal(false)

	return (
		<>
			<Btn popovertarget={id}>{cta}</Btn>
			<div
				onToggle={(event) => {
					if (event.newState === 'open') {
						showing.value = true
					} else {
						showing.value = false
					}
				}}
				id={id}
				popover='auto'
				class={cls(classes.popover, className)}
			>
				{showing.value && children}
			</div>
		</>
	)
}
