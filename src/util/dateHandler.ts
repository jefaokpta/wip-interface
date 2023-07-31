
export function mediaDateFormater(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1) < 10 ? `0${date.getMonth() + 1}` : date.getMonth()
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()

    return `${year}-${month}-${day}`
}