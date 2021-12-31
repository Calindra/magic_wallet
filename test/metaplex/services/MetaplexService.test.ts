import { Connection, programs } from '@metaplex/js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import fs from "fs";

describe('Metaplex', () => {
    

    it('works', async () => {
        const connection = new Connection('devnet');
        const tokenPublicKey = 'Gz3vYbpsB2agTsAwedtvtTkQ1CG9vsioqLW3r9ecNpvZ';

        // await programs.metadata.Metadata.load(connection, tokenPublicKey);

        const ownedMetadata = await Metadata.load(connection, tokenPublicKey);
        console.log(ownedMetadata);

        fs.writeFileSync('teste.jpg', ownedMetadata.info.data)
    })
})