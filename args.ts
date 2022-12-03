export default function getArgument(name: string): string | null {
    return process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
}