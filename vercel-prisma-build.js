import fs from 'fs';
import path from 'path';
import { nodeFileTrace } from '@vercel/nft';

async function main() {
    // 1. Cria um .npmrc temporário com o token de ambiente (se necessário)
    const token = process.env.GITHUB_PACKAGES_TOKEN;
    if (token) {
        const npmrcContent = `
@gabrielmbatista:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${token}
`;
        fs.writeFileSync('.npmrc', npmrcContent.trim());
        console.log('✅ .npmrc criado com sucesso');
    }

    // 2. Prisma: inclui dependências do @prisma/client no .next/standalone
    const { fileList } = await nodeFileTrace(['node_modules/@prisma/client/index.js']);
    for (const file of fileList) {
        const src = path.resolve(file);
        const dest = path.resolve('.next/standalone', file);
        if (fs.existsSync(src)) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
        }
    }

    console.log('✅ Prisma files copiados para .next/standalone');

    // 3. Remove .npmrc temporário após o build (opcional)
    if (fs.existsSync('.npmrc')) {
        fs.unlinkSync('.npmrc');
        console.log('✅ .npmrc removido após o build');
    }

    // Função para copiar diretórios e arquivos recursivamente
    function copyDirSync(src, dest) {
        if (!fs.existsSync(src)) return;
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            for (const entry of fs.readdirSync(src)) {
                copyDirSync(path.join(src, entry), path.join(dest, entry));
            }
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    // 4. Copia a pasta .prisma (binários) para .next/standalone/node_modules/.prisma
    const srcPrisma = path.resolve('node_modules/.prisma');
    const destPrisma = path.resolve('.next/standalone/node_modules/.prisma');
    copyDirSync(srcPrisma, destPrisma);
    console.log('✅ Binários do Prisma copiados para .next/standalone/node_modules/.prisma');
}

main();
