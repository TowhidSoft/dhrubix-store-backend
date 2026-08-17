// import { filenameToUrl, filenamesToUrls } from './file-url.utils';

// // Define which models have which file fields
// const MODEL_FILE_FIELDS: Record<string, string[]> = {
//     brand: ['img', 'logo', 'image', 'banner'],
//     product: ['img', 'images', 'thumbnail', 'gallery'],
//     user: ['avatar', 'profileImage', 'coverPhoto'],
//     category: ['image', 'icon', 'banner'],
//     blog: ['featuredImage', 'images'],
//     // Add more as needed
// };

// // Transform single object
// export const transformFileFields = <T extends Record<string, any>>(
//     data: T,
//     modelName?: string
// ): T => {
//     if (!data) return data;
    
//     const fields = modelName ? MODEL_FILE_FIELDS[modelName] || [] : [];
//     const result = { ...data };
    
//     fields.forEach(field => {
//         if (field in result && result[field] !== undefined) {
//             if (Array.isArray(result[field])) {
//                 result[field] = filenamesToUrls(result[field]);
//             } else if (typeof result[field] === 'string') {
//                 result[field] = filenameToUrl(result[field]);
//             }
//         }
//     });
    
//     return result;
// };

// // Transform array of objects
// export const transformManyFileFields = <T extends Record<string, any>>(
//     dataArray: T[],
//     modelName?: string
// ): T[] => {
//     if (!Array.isArray(dataArray)) return [];
//     return dataArray.map(item => transformFileFields(item, modelName));
// };

// // Transform specific fields (explicit)
// export const transformSpecificFields = <T extends Record<string, any>>(
//     data: T,
//     fieldsToTransform: string[]
// ): T => {
//     if (!data) return data;
    
//     const result = { ...data };
    
//     fieldsToTransform.forEach(field => {
//         if (field in result && result[field] !== undefined) {
//             if (Array.isArray(result[field])) {
//                 result[field] = filenamesToUrls(result[field]);
//             } else if (typeof result[field] === 'string') {
//                 result[field] = filenameToUrl(result[field]);
//             }
//         }
//     });
    
//     return result;
// };