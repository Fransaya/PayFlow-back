// import { DbService, socialIntegrationRepo } from '@src/libs/db';

// import { Injectable, InternalServerErrorException } from '@nestjs/common';

// import { encryptToken } from '@src/encryption/services/encryption.service';

// @Injectable()
// export class MetaTokenService {
//   constructor(private readonly dbService: DbService) {}

//   async changeCodeForToken(
//     tenant_id: string,
//     channel: string,
//     access_token: string,
//     user_id: string,
//     expires_in: string,
//     scops: string[],
//   ) {
//     try {
//       if (!access_token || !user_id) throw new Error('Invalid parameters');
//       if (!user_id.trim()) throw new Error('User ID is required');

//       const access_token_enc: string = await encryptToken(access_token);

//       return await this.dbService.transaction(async (tx) => {
//         const socialIntegration = socialIntegrationRepo(tx);

//         // Upsert token de integración social
//         return await socialIntegration.upsertConfigSocialIntegration({
//           tenant_id,
//           channel,
//           access_token_enc,
//           user_id,
//           expires_in,
//           scops,
//         });
//       });
//     } catch (error) {
//       throw new InternalServerErrorException(
//         `Error changing code for token: ${error}`,
//       );
//     }
//   }
// }
