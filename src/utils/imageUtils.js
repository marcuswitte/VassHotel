import * as ImageManipulator from 'expo-image-manipulator';

// Redimensiona para 200×200 e retorna uma data URI base64 pronta para o Firestore.
// Garante que o tamanho fique bem abaixo do limite de 1 MB por documento.
export async function compressToBase64(uri) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 200, height: 200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return `data:image/jpeg;base64,${result.base64}`;
}
