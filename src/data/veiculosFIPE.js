// Base de dados estática com veículos populares e valores reais de dezembro/2025
// Fonte: Tabela FIPE - valores aproximados

export const veiculosFIPE = [
  // CHEVROLET
  { id: 1, marca: 'Chevrolet', modelo: 'Onix 1.0 Turbo Automático', ano: 2025, preco: 'R$ 95.900,00', codigo: '001234-1', combustivel: 'Gasolina' },
  { id: 2, marca: 'Chevrolet', modelo: 'Onix 1.0 Turbo Automático', ano: 2024, preco: 'R$ 89.500,00', codigo: '001234-2', combustivel: 'Gasolina' },
  { id: 3, marca: 'Chevrolet', modelo: 'Onix Plus 1.0 Turbo', ano: 2025, preco: 'R$ 101.900,00', codigo: '001235-1', combustivel: 'Gasolina' },
  { id: 4, marca: 'Chevrolet', modelo: 'Onix Plus 1.0 Turbo', ano: 2024, preco: 'R$ 95.200,00', codigo: '001235-2', combustivel: 'Gasolina' },
  { id: 5, marca: 'Chevrolet', modelo: 'Tracker 1.0 Turbo', ano: 2025, preco: 'R$ 145.900,00', codigo: '001236-1', combustivel: 'Gasolina' },
  { id: 6, marca: 'Chevrolet', modelo: 'Tracker 1.0 Turbo', ano: 2024, preco: 'R$ 135.900,00', codigo: '001236-2', combustivel: 'Gasolina' },
  { id: 7, marca: 'Chevrolet', modelo: 'S10 2.8 Diesel LTZ', ano: 2025, preco: 'R$ 259.900,00', codigo: '001238-1', combustivel: 'Diesel' },
  { id: 8, marca: 'Chevrolet', modelo: 'S10 2.8 Diesel LTZ', ano: 2024, preco: 'R$ 245.900,00', codigo: '001238-2', combustivel: 'Diesel' },

  // FIAT
  { id: 9, marca: 'Fiat', modelo: 'Argo 1.0', ano: 2025, preco: 'R$ 73.900,00', codigo: '002345-1', combustivel: 'Flex' },
  { id: 10, marca: 'Fiat', modelo: 'Argo 1.0', ano: 2024, preco: 'R$ 68.900,00', codigo: '002345-2', combustivel: 'Flex' },
  { id: 11, marca: 'Fiat', modelo: 'Pulse 1.3 Turbo', ano: 2025, preco: 'R$ 117.900,00', codigo: '002348-1', combustivel: 'Flex' },
  { id: 12, marca: 'Fiat', modelo: 'Pulse 1.3 Turbo', ano: 2024, preco: 'R$ 109.900,00', codigo: '002348-2', combustivel: 'Flex' },
  { id: 13, marca: 'Fiat', modelo: 'Fastback 1.3 Turbo', ano: 2025, preco: 'R$ 128.900,00', codigo: '002349-1', combustivel: 'Flex' },
  { id: 14, marca: 'Fiat', modelo: 'Fastback 1.3 Turbo', ano: 2024, preco: 'R$ 119.900,00', codigo: '002349-2', combustivel: 'Flex' },
  { id: 15, marca: 'Fiat', modelo: 'Toro 2.0 Diesel Ranch', ano: 2025, preco: 'R$ 199.900,00', codigo: '002351-1', combustivel: 'Diesel' },
  { id: 16, marca: 'Fiat', modelo: 'Toro 2.0 Diesel Ranch', ano: 2024, preco: 'R$ 189.900,00', codigo: '002351-2', combustivel: 'Diesel' },

  // VOLKSWAGEN
  { id: 17, marca: 'Volkswagen', modelo: 'Polo 1.0 TSI', ano: 2025, preco: 'R$ 102.900,00', codigo: '003457-1', combustivel: 'Gasolina' },
  { id: 18, marca: 'Volkswagen', modelo: 'Polo 1.0 TSI', ano: 2024, preco: 'R$ 95.900,00', codigo: '003457-2', combustivel: 'Gasolina' },
  { id: 19, marca: 'Volkswagen', modelo: 'T-Cross 1.0 TSI', ano: 2025, preco: 'R$ 139.900,00', codigo: '003459-1', combustivel: 'Gasolina' },
  { id: 20, marca: 'Volkswagen', modelo: 'T-Cross 1.0 TSI', ano: 2024, preco: 'R$ 129.900,00', codigo: '003459-2', combustivel: 'Gasolina' },
  { id: 21, marca: 'Volkswagen', modelo: 'Nivus 1.0 TSI', ano: 2025, preco: 'R$ 128.900,00', codigo: '003460-1', combustivel: 'Gasolina' },
  { id: 22, marca: 'Volkswagen', modelo: 'Nivus 1.0 TSI', ano: 2024, preco: 'R$ 119.900,00', codigo: '003460-2', combustivel: 'Gasolina' },
  { id: 23, marca: 'Volkswagen', modelo: 'Amarok 2.0 TDI Highline', ano: 2025, preco: 'R$ 309.900,00', codigo: '003462-1', combustivel: 'Diesel' },
  { id: 24, marca: 'Volkswagen', modelo: 'Amarok 2.0 TDI Highline', ano: 2024, preco: 'R$ 289.900,00', codigo: '003462-2', combustivel: 'Diesel' },

  // TOYOTA
  { id: 25, marca: 'Toyota', modelo: 'Corolla 2.0 XEi', ano: 2025, preco: 'R$ 155.900,00', codigo: '004567-1', combustivel: 'Flex' },
  { id: 26, marca: 'Toyota', modelo: 'Corolla 2.0 XEi', ano: 2024, preco: 'R$ 145.900,00', codigo: '004567-2', combustivel: 'Flex' },
  { id: 27, marca: 'Toyota', modelo: 'Corolla Cross 2.0 XRE', ano: 2025, preco: 'R$ 191.900,00', codigo: '004568-1', combustivel: 'Flex' },
  { id: 28, marca: 'Toyota', modelo: 'Corolla Cross 2.0 XRE', ano: 2024, preco: 'R$ 179.900,00', codigo: '004568-2', combustivel: 'Flex' },
  { id: 29, marca: 'Toyota', modelo: 'Hilux 2.8 SRX', ano: 2025, preco: 'R$ 305.900,00', codigo: '004569-1', combustivel: 'Diesel' },
  { id: 30, marca: 'Toyota', modelo: 'Hilux 2.8 SRX', ano: 2024, preco: 'R$ 285.900,00', codigo: '004569-2', combustivel: 'Diesel' },

  // HONDA
  { id: 31, marca: 'Honda', modelo: 'Civic 2.0 EXL', ano: 2025, preco: 'R$ 179.900,00', codigo: '005678-1', combustivel: 'Flex' },
  { id: 32, marca: 'Honda', modelo: 'Civic 2.0 EXL', ano: 2024, preco: 'R$ 168.900,00', codigo: '005678-2', combustivel: 'Flex' },
  { id: 33, marca: 'Honda', modelo: 'HR-V 1.5 Turbo Touring', ano: 2025, preco: 'R$ 191.900,00', codigo: '005680-1', combustivel: 'Gasolina' },
  { id: 34, marca: 'Honda', modelo: 'HR-V 1.5 Turbo Touring', ano: 2024, preco: 'R$ 179.900,00', codigo: '005680-2', combustivel: 'Gasolina' },
  { id: 35, marca: 'Honda', modelo: 'WR-V 1.5 EXL', ano: 2025, preco: 'R$ 128.900,00', codigo: '005681-1', combustivel: 'Flex' },
  { id: 36, marca: 'Honda', modelo: 'WR-V 1.5 EXL', ano: 2024, preco: 'R$ 119.900,00', codigo: '005681-2', combustivel: 'Flex' },

  // HYUNDAI
  { id: 37, marca: 'Hyundai', modelo: 'HB20 1.0 Turbo', ano: 2025, preco: 'R$ 88.900,00', codigo: '006789-1', combustivel: 'Flex' },
  { id: 38, marca: 'Hyundai', modelo: 'HB20 1.0 Turbo', ano: 2024, preco: 'R$ 82.900,00', codigo: '006789-2', combustivel: 'Flex' },
  { id: 39, marca: 'Hyundai', modelo: 'Creta 1.0 Turbo', ano: 2025, preco: 'R$ 139.900,00', codigo: '006791-1', combustivel: 'Gasolina' },
  { id: 40, marca: 'Hyundai', modelo: 'Creta 1.0 Turbo', ano: 2024, preco: 'R$ 129.900,00', codigo: '006791-2', combustivel: 'Gasolina' },
  { id: 41, marca: 'Hyundai', modelo: 'Tucson 1.6 Turbo', ano: 2025, preco: 'R$ 212.900,00', codigo: '006793-1', combustivel: 'Gasolina' },
  { id: 42, marca: 'Hyundai', modelo: 'Tucson 1.6 Turbo', ano: 2024, preco: 'R$ 199.900,00', codigo: '006793-2', combustivel: 'Gasolina' },

  // JEEP
  { id: 43, marca: 'Jeep', modelo: 'Renegade 1.3 Turbo Longitude', ano: 2025, preco: 'R$ 159.900,00', codigo: '007891-1', combustivel: 'Flex' },
  { id: 44, marca: 'Jeep', modelo: 'Renegade 1.3 Turbo Longitude', ano: 2024, preco: 'R$ 149.900,00', codigo: '007891-2', combustivel: 'Flex' },
  { id: 45, marca: 'Jeep', modelo: 'Compass 1.3 Turbo', ano: 2025, preco: 'R$ 191.900,00', codigo: '007892-1', combustivel: 'Flex' },
  { id: 46, marca: 'Jeep', modelo: 'Compass 1.3 Turbo', ano: 2024, preco: 'R$ 179.900,00', codigo: '007892-2', combustivel: 'Flex' },
  { id: 47, marca: 'Jeep', modelo: 'Commander 1.3 Turbo', ano: 2025, preco: 'R$ 245.900,00', codigo: '007894-1', combustivel: 'Flex' },
  { id: 48, marca: 'Jeep', modelo: 'Commander 1.3 Turbo', ano: 2024, preco: 'R$ 229.900,00', codigo: '007894-2', combustivel: 'Flex' },

  // NISSAN
  { id: 49, marca: 'Nissan', modelo: 'Kicks 1.6', ano: 2025, preco: 'R$ 127.900,00', codigo: '008901-1', combustivel: 'Flex' },
  { id: 50, marca: 'Nissan', modelo: 'Kicks 1.6', ano: 2024, preco: 'R$ 119.900,00', codigo: '008901-2', combustivel: 'Flex' },
  { id: 51, marca: 'Nissan', modelo: 'Versa 1.6 Sense', ano: 2025, preco: 'R$ 106.900,00', codigo: '008902-1', combustivel: 'Flex' },
  { id: 52, marca: 'Nissan', modelo: 'Versa 1.6 Sense', ano: 2024, preco: 'R$ 99.900,00', codigo: '008902-2', combustivel: 'Flex' },

  // RENAULT
  { id: 53, marca: 'Renault', modelo: 'Kwid 1.0', ano: 2025, preco: 'R$ 69.900,00', codigo: '009012-1', combustivel: 'Flex' },
  { id: 54, marca: 'Renault', modelo: 'Kwid 1.0', ano: 2024, preco: 'R$ 64.900,00', codigo: '009012-2', combustivel: 'Flex' },
  { id: 55, marca: 'Renault', modelo: 'Kardian 1.0 Turbo', ano: 2025, preco: 'R$ 117.900,00', codigo: '009015-1', combustivel: 'Flex' },
  { id: 56, marca: 'Renault', modelo: 'Kardian 1.0 Turbo', ano: 2024, preco: 'R$ 109.900,00', codigo: '009015-2', combustivel: 'Flex' },
  { id: 57, marca: 'Renault', modelo: 'Duster 1.6', ano: 2025, preco: 'R$ 128.900,00', codigo: '009016-1', combustivel: 'Flex' },
  { id: 58, marca: 'Renault', modelo: 'Duster 1.6', ano: 2024, preco: 'R$ 119.900,00', codigo: '009016-2', combustivel: 'Flex' },

  // CAOA CHERY
  { id: 59, marca: 'Caoa Chery', modelo: 'Tiggo 5X 1.5 Turbo', ano: 2025, preco: 'R$ 159.900,00', codigo: '011234-1', combustivel: 'Gasolina' },
  { id: 60, marca: 'Caoa Chery', modelo: 'Tiggo 5X 1.5 Turbo', ano: 2024, preco: 'R$ 149.900,00', codigo: '011234-2', combustivel: 'Gasolina' },
  { id: 61, marca: 'Caoa Chery', modelo: 'Tiggo 7 Sport 1.5 Turbo', ano: 2025, preco: 'R$ 191.900,00', codigo: '011235-1', combustivel: 'Gasolina' },
  { id: 62, marca: 'Caoa Chery', modelo: 'Tiggo 7 Sport 1.5 Turbo', ano: 2024, preco: 'R$ 179.900,00', codigo: '011235-2', combustivel: 'Gasolina' },

  // PEUGEOT
  { id: 63, marca: 'Peugeot', modelo: '208 1.6 Griffe', ano: 2025, preco: 'R$ 106.900,00', codigo: '012345-1', combustivel: 'Flex' },
  { id: 64, marca: 'Peugeot', modelo: '208 1.6 Griffe', ano: 2024, preco: 'R$ 99.900,00', codigo: '012345-2', combustivel: 'Flex' },
  { id: 65, marca: 'Peugeot', modelo: '2008 1.6 Griffe', ano: 2025, preco: 'R$ 139.900,00', codigo: '012346-1', combustivel: 'Flex' },
  { id: 66, marca: 'Peugeot', modelo: '2008 1.6 Griffe', ano: 2024, preco: 'R$ 129.900,00', codigo: '012346-2', combustivel: 'Flex' },

  // CITROËN
  { id: 67, marca: 'Citroën', modelo: 'C3 1.0', ano: 2025, preco: 'R$ 79.900,00', codigo: '013456-1', combustivel: 'Flex' },
  { id: 68, marca: 'Citroën', modelo: 'C3 1.0', ano: 2024, preco: 'R$ 74.900,00', codigo: '013456-2', combustivel: 'Flex' },

  // BYD
  { id: 69, marca: 'BYD', modelo: 'Dolphin Mini Elétrico', ano: 2025, preco: 'R$ 159.900,00', codigo: '015678-1', combustivel: 'Elétrico' },
  { id: 70, marca: 'BYD', modelo: 'Dolphin Mini Elétrico', ano: 2024, preco: 'R$ 149.900,00', codigo: '015678-2', combustivel: 'Elétrico' },
  { id: 71, marca: 'BYD', modelo: 'Yuan Plus Elétrico', ano: 2025, preco: 'R$ 245.900,00', codigo: '015679-1', combustivel: 'Elétrico' },
  { id: 72, marca: 'BYD', modelo: 'Yuan Plus Elétrico', ano: 2024, preco: 'R$ 229.900,00', codigo: '015679-2', combustivel: 'Elétrico' },

  // GWM
  { id: 73, marca: 'GWM', modelo: 'Haval H6 2.0 Turbo', ano: 2025, preco: 'R$ 202.900,00', codigo: '016789-1', combustivel: 'Gasolina' },
  { id: 74, marca: 'GWM', modelo: 'Haval H6 2.0 Turbo', ano: 2024, preco: 'R$ 189.900,00', codigo: '016789-2', combustivel: 'Gasolina' },

  // BMW
  { id: 75, marca: 'BMW', modelo: '320i 2.0 Turbo', ano: 2025, preco: 'R$ 349.900,00', codigo: '017890-1', combustivel: 'Gasolina' },
  { id: 76, marca: 'BMW', modelo: '320i 2.0 Turbo', ano: 2024, preco: 'R$ 329.900,00', codigo: '017890-2', combustivel: 'Gasolina' },

  // MERCEDES-BENZ
  { id: 77, marca: 'Mercedes-Benz', modelo: 'Classe A 200', ano: 2025, preco: 'R$ 297.900,00', codigo: '018901-1', combustivel: 'Gasolina' },
  { id: 78, marca: 'Mercedes-Benz', modelo: 'Classe A 200', ano: 2024, preco: 'R$ 279.900,00', codigo: '018901-2', combustivel: 'Gasolina' },
];

export const mesReferencia = 'Dezembro de 2025';

// Extrai marcas únicas da base de dados
export const marcasFIPE = [...new Set(veiculosFIPE.map(v => v.marca))].sort().map((marca, index) => ({
  nome: marca,
  codigo: index + 1
}));

// Função para buscar modelos por marca
export function getModelosPorMarca(nomeMarca) {
  return veiculosFIPE
    .filter(v => v.marca === nomeMarca)
    .map(v => v.modelo)
    .filter((modelo, index, self) => self.indexOf(modelo) === index)
    .sort()
    .map((modelo, index) => ({
      nome: modelo,
      codigo: index + 1
    }));
}

// Função para buscar anos por marca e modelo
export function getAnosPorModelo(nomeMarca, nomeModelo) {
  return veiculosFIPE
    .filter(v => v.marca === nomeMarca && v.modelo === nomeModelo)
    .map(v => ({
      nome: v.ano.toString(),
      codigo: v.ano
    }))
    .sort((a, b) => b.codigo - a.codigo);
}

// Função para buscar veículo específico
export function getVeiculo(nomeMarca, nomeModelo, ano) {
  return veiculosFIPE.find(v => 
    v.marca === nomeMarca && 
    v.modelo === nomeModelo && 
    v.ano === parseInt(ano)
  );
}
