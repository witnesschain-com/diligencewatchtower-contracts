"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const BASE_INVARIANTS_DIR = path_1.default.join(__dirname, '..', 'contracts', 'test', 'invariants');
const BASE_ECHIDNA_DIR = path_1.default.join(__dirname, '..', 'contracts', 'echidna');
const BASE_DOCS_DIR = path_1.default.join(__dirname, '..', 'invariant-docs');
const BASE_ECHIDNA_GH_URL = '../contracts/echidna/';
const BASE_INVARIANT_GH_URL = '../contracts/test/invariants/';
const NATSPEC_INV = '@custom:invariant';
const BLOCK_COMMENT_PREFIX_REGEX = /\*(\/)?/;
const BLOCK_COMMENT_HEADER_REGEX = /\*\s(.)+/;
const writtenFiles = [];
/**
 * Lazy-parses all test files in the `contracts/test/invariants` directory to generate documentation
 * on all invariant tests.
 */
const docGen = (dir) => {
    // Grab all files within the invariants test dir
    const files = fs_1.default.readdirSync(dir);
    // Array to store all found invariant documentation comments.
    const docs = [];
    for (const fileName of files) {
        // Read the contents of the invariant test file.
        const fileContents = fs_1.default.readFileSync(path_1.default.join(dir, fileName)).toString();
        // Split the file into individual lines and trim whitespace.
        const lines = fileContents.split('\n').map((line) => line.trim());
        // Create an object to store all invariant test docs for the current contract
        const isEchidna = fileName.startsWith('Fuzz');
        const name = isEchidna
            ? fileName.replace('Fuzz', '').replace('.sol', '')
            : fileName.replace('.t.sol', '');
        const contract = { name, fileName, isEchidna, docs: [] };
        let currentDoc;
        // Loop through all lines to find comments.
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.startsWith('/**')) {
                // We are at the beginning of a new doc comment. Reset the `currentDoc`.
                currentDoc = {};
                // Move on to the next line
                line = lines[++i];
                // We have an invariant doc
                if (line.startsWith(`* ${NATSPEC_INV}`)) {
                    // Assign the header of the invariant doc.
                    // TODO: Handle ambiguous case for `INVARIANT: ` prefix.
                    // TODO: Handle multi-line headers.
                    currentDoc = {
                        header: line.replace(`* ${NATSPEC_INV}`, '').trim(),
                        desc: '',
                    };
                    // If the header is multi-line, continue appending to the `currentDoc`'s header.
                    while (BLOCK_COMMENT_HEADER_REGEX.test((line = lines[++i]))) {
                        currentDoc.header += ` ${line
                            .replace(BLOCK_COMMENT_PREFIX_REGEX, '')
                            .trim()}`;
                    }
                    // Process the description
                    while ((line = lines[++i]).startsWith('*')) {
                        line = line.replace(BLOCK_COMMENT_PREFIX_REGEX, '').trim();
                        // If the line has any contents, insert it into the desc.
                        // Otherwise, consider it a linebreak.
                        currentDoc.desc += line.length > 0 ? `${line} ` : '\n';
                    }
                    // Set the line number of the test
                    currentDoc.lineNo = i + 1;
                    // Add the doc to the contract
                    contract.docs.push(currentDoc);
                }
            }
        }
        // Add the contract to the array of docs
        docs.push(contract);
    }
    for (const contract of docs) {
        const fileName = path_1.default.join(BASE_DOCS_DIR, `${contract.name}.md`);
        const alreadyWritten = writtenFiles.includes(fileName);
        // If the file has already been written, append the extra docs to the end.
        // Otherwise, write the file from scratch.
        fs_1.default.writeFileSync(fileName, alreadyWritten
            ? `${fs_1.default.readFileSync(fileName)}\n${renderContractDoc(contract, false)}`
            : renderContractDoc(contract, true));
        // If the file was just written for the first time, add it to the list of written files.
        if (!alreadyWritten) {
            writtenFiles.push(fileName);
        }
    }
    console.log(`Generated invariant test documentation for:\n - ${docs.length} contracts\n - ${docs.reduce((acc, contract) => acc + contract.docs.length, 0)} invariant tests\nsuccessfully!`);
};
/**
 * Generate a table of contents for all invariant docs and place it in the README.
 */
const tocGen = () => {
    const autoTOCPrefix = '<!-- START autoTOC -->\n';
    const autoTOCPostfix = '<!-- END autoTOC -->\n';
    // Grab the name of all markdown files in `BASE_DOCS_DIR` except for `README.md`.
    const files = fs_1.default
        .readdirSync(BASE_DOCS_DIR)
        .filter((fileName) => fileName !== 'README.md');
    // Generate a table of contents section.
    const tocList = files
        .map((fileName) => `- [${fileName.replace('.md', '')}](./${fileName})`)
        .join('\n');
    const toc = `${autoTOCPrefix}\n## Table of Contents\n${tocList}\n${autoTOCPostfix}`;
    // Write the table of contents to the README.
    const readmeContents = fs_1.default
        .readFileSync(path_1.default.join(BASE_DOCS_DIR, 'README.md'))
        .toString();
    const above = readmeContents.split(autoTOCPrefix)[0];
    const below = readmeContents.split(autoTOCPostfix)[1];
    fs_1.default.writeFileSync(path_1.default.join(BASE_DOCS_DIR, 'README.md'), `${above}${toc}${below}`);
};
/**
 * Render a `Contract` object into valid markdown.
 */
const renderContractDoc = (contract, header) => {
    const _header = header ? `# \`${contract.name}\` Invariants\n` : '';
    const docs = contract.docs
        .map((doc) => {
        const line = `${contract.fileName}#L${doc.lineNo}`;
        return `## ${doc.header}\n**Test:** [\`${line}\`](${getGithubBase(contract)}${line})\n\n${doc.desc}`;
    })
        .join('\n\n');
    return `${_header}\n${docs}`;
};
/**
 * Get the base URL for the test contract
 */
const getGithubBase = ({ isEchidna }) => isEchidna ? BASE_ECHIDNA_GH_URL : BASE_INVARIANT_GH_URL;
// Generate the docs
// Forge
console.log('Generating docs for forge invariants...');
docGen(BASE_INVARIANTS_DIR);
// New line
console.log();
// Echidna
console.log('Generating docs for echidna invariants...');
docGen(BASE_ECHIDNA_DIR);
// Generate an updated table of contents
tocGen();
