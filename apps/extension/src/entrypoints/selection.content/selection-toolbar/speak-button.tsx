import { IconLoader2, IconVolume } from '@tabler/icons-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { useSpeakText } from '@/hooks/speak'
import { isTooltipVisibleAtom, selectionContentAtom } from './atom'

export function SpeakButton() {
  const selectionContent = useAtomValue(selectionContentAtom)
  const setIsTooltipVisible = useSetAtom(isTooltipVisibleAtom)
  const { speak, isPending, canSpeak } = useSpeakText()

  const handleClick = useCallback(() => {
    setIsTooltipVisible(false)
    if (selectionContent) {
      speak(selectionContent)
    }
  }, [selectionContent, speak, setIsTooltipVisible])

  // Don't render the button if TTS is not available
  if (!canSpeak) {
    return null
  }

  return (
    <button
      type="button"
      className="size-6 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleClick}
      disabled={isPending}
      title="Speak selected text"
    >
      {isPending
        ? (
            <IconLoader2 className="size-4 animate-spin" strokeWidth={1.6} />
          )
        : (
            <IconVolume className="size-4" strokeWidth={1.6} />
          )}
    </button>
  )
}
