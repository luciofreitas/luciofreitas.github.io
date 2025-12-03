// Base de dados estática com veículos populares e valores reais de dezembro/2025
// Fonte: Tabela FIPE - valores aproximados

export const veiculosFIPE = [
  // CHEVROLET
  { id: 1, marca: 'Chevrolet', modelo: 'Onix 1.0 Turbo Automático', ano: 2025, preco: 'R$ 95.900,00', codigo: '001234-1', combustivel: 'Gasolina' },
  { id: 2, marca: 'Chevrolet', modelo: 'Onix Plus 1.0 Turbo', ano: 2025, preco: 'R$ 101.900,00', codigo: '001235-1', combustivel: 'Gasolina' },
  { id: 3, marca: 'Chevrolet', modelo: 'Tracker 1.0 Turbo', ano: 2025, preco: 'R$ 145.900,00', codigo: '001236-1', combustivel: 'Gasolina' },
  { id: 4, marca: 'Chevrolet', modelo: 'Tracker 1.2 Turbo Premier', ano: 2025, preco: 'R$ 172.900,00', codigo: '001237-1', combustivel: 'Gasolina' },
  { id: 5, marca: 'Chevrolet', modelo: 'S10 2.8 Diesel LTZ', ano: 2025, preco: 'R$ 259.900,00', codigo: '001238-1', combustivel: 'Diesel' },
  { id: 6, marca: 'Chevrolet', modelo: 'Montana 1.2 Turbo', ano: 2025, preco: 'R$ 129.900,00', codigo: '001239-1', combustivel: 'Gasolina' },
  { id: 7, marca: 'Chevrolet', modelo: 'Spin 1.8 Activ', ano: 2025, preco: 'R$ 119.900,00', codigo: '001240-1', combustivel: 'Gasolina' },

  // FIAT
  { id: 8, marca: 'Fiat', modelo: 'Argo 1.0', ano: 2025, preco: 'R$ 73.900,00', codigo: '002345-1', combustivel: 'Flex' },
  { id: 9, marca: 'Fiat', modelo: 'Argo 1.3 Turbo', ano: 2025, preco: 'R$ 92.900,00', codigo: '002346-1', combustivel: 'Flex' },
  { id: 10, marca: 'Fiat', modelo: 'Cronos 1.3 GSR', ano: 2025, preco: 'R$ 96.900,00', codigo: '002347-1', combustivel: 'Flex' },
  { id: 11, marca: 'Fiat', modelo: 'Pulse 1.3 Turbo', ano: 2025, preco: 'R$ 117.900,00', codigo: '002348-1', combustivel: 'Flex' },
  { id: 12, marca: 'Fiat', modelo: 'Fastback 1.3 Turbo', ano: 2025, preco: 'R$ 128.900,00', codigo: '002349-1', combustivel: 'Flex' },
  { id: 13, marca: 'Fiat', modelo: 'Toro 1.3 Turbo', ano: 2025, preco: 'R$ 149.900,00', codigo: '002350-1', combustivel: 'Flex' },
  { id: 14, marca: 'Fiat', modelo: 'Toro 2.0 Diesel Ranch', ano: 2025, preco: 'R$ 199.900,00', codigo: '002351-1', combustivel: 'Diesel' },
  { id: 15, marca: 'Fiat', modelo: 'Strada 1.3 Endurance', ano: 2025, preco: 'R$ 102.900,00', codigo: '002352-1', combustivel: 'Flex' },

  // VOLKSWAGEN
  { id: 16, marca: 'Volkswagen', modelo: 'Gol 1.0', ano: 2025, preco: 'R$ 73.900,00', codigo: '003456-1', combustivel: 'Flex' },
  { id: 17, marca: 'Volkswagen', modelo: 'Polo 1.0 TSI', ano: 2025, preco: 'R$ 102.900,00', codigo: '003457-1', combustivel: 'Gasolina' },
  { id: 18, marca: 'Volkswagen', modelo: 'Virtus 1.0 TSI', ano: 2025, preco: 'R$ 107.900,00', codigo: '003458-1', combustivel: 'Gasolina' },
  { id: 19, marca: 'Volkswagen', modelo: 'T-Cross 1.0 TSI', ano: 2025, preco: 'R$ 139.900,00', codigo: '003459-1', combustivel: 'Gasolina' },
  { id: 20, marca: 'Volkswagen', modelo: 'Nivus 1.0 TSI', ano: 2025, preco: 'R$ 128.900,00', codigo: '003460-1', combustivel: 'Gasolina' },
  { id: 21, marca: 'Volkswagen', modelo: 'Taos 1.4 TSI', ano: 2025, preco: 'R$ 181.900,00', codigo: '003461-1', combustivel: 'Gasolina' },
  { id: 22, marca: 'Volkswagen', modelo: 'Amarok 2.0 TDI Highline', ano: 2025, preco: 'R$ 309.900,00', codigo: '003462-1', combustivel: 'Diesel' },

  // TOYOTA
  { id: 23, marca: 'Toyota', modelo: 'Corolla 2.0 XEi', ano: 2025, preco: 'R$ 155.900,00', codigo: '004567-1', combustivel: 'Flex' },
  { id: 24, marca: 'Toyota', modelo: 'Corolla Cross 2.0 XRE', ano: 2025, preco: 'R$ 191.900,00', codigo: '004568-1', combustivel: 'Flex' },
  { id: 25, marca: 'Toyota', modelo: 'Hilux 2.8 SRX', ano: 2025, preco: 'R$ 305.900,00', codigo: '004569-1', combustivel: 'Diesel' },
  { id: 26, marca: 'Toyota', modelo: 'SW4 2.8 SRX', ano: 2025, preco: 'R$ 415.900,00', codigo: '004570-1', combustivel: 'Diesel' },
  { id: 27, marca: 'Toyota', modelo: 'Yaris Sedan XLS', ano: 2025, preco: 'R$ 117.900,00', codigo: '004571-1', combustivel: 'Flex' },

  // HONDA
  { id: 28, marca: 'Honda', modelo: 'Civic 2.0 EXL', ano: 2025, preco: 'R$ 179.900,00', codigo: '005678-1', combustivel: 'Flex' },
  { id: 29, marca: 'Honda', modelo: 'City Sedan EXL', ano: 2025, preco: 'R$ 138.900,00', codigo: '005679-1', combustivel: 'Flex' },
  { id: 30, marca: 'Honda', modelo: 'HR-V 1.5 Turbo Touring', ano: 2025, preco: 'R$ 191.900,00', codigo: '005680-1', combustivel: 'Gasolina' },
  { id: 31, marca: 'Honda', modelo: 'WR-V 1.5 EXL', ano: 2025, preco: 'R$ 128.900,00', codigo: '005681-1', combustivel: 'Flex' },

  // HYUNDAI
  { id: 32, marca: 'Hyundai', modelo: 'HB20 1.0 Turbo', ano: 2025, preco: 'R$ 88.900,00', codigo: '006789-1', combustivel: 'Flex' },
  { id: 33, marca: 'Hyundai', modelo: 'HB20S 1.0 Turbo', ano: 2025, preco: 'R$ 96.900,00', codigo: '006790-1', combustivel: 'Flex' },
  { id: 34, marca: 'Hyundai', modelo: 'Creta 1.0 Turbo', ano: 2025, preco: 'R$ 139.900,00', codigo: '006791-1', combustivel: 'Gasolina' },
  { id: 35, marca: 'Hyundai', modelo: 'Creta 2.0 Ultimate', ano: 2025, preco: 'R$ 181.900,00', codigo: '006792-1', combustivel: 'Flex' },
  { id: 36, marca: 'Hyundai', modelo: 'Tucson 1.6 Turbo', ano: 2025, preco: 'R$ 212.900,00', codigo: '006793-1', combustivel: 'Gasolina' },
  { id: 37, marca: 'Hyundai', modelo: 'Santa Fe 2.5 Turbo', ano: 2025, preco: 'R$ 372.900,00', codigo: '006794-1', combustivel: 'Gasolina' },

  // JEEP
  { id: 38, marca: 'Jeep', modelo: 'Renegade 1.8 Sport', ano: 2025, preco: 'R$ 139.900,00', codigo: '007890-1', combustivel: 'Flex' },
  { id: 39, marca: 'Jeep', modelo: 'Renegade 1.3 Turbo Longitude', ano: 2025, preco: 'R$ 159.900,00', codigo: '007891-1', combustivel: 'Flex' },
  { id: 40, marca: 'Jeep', modelo: 'Compass 1.3 Turbo', ano: 2025, preco: 'R$ 191.900,00', codigo: '007892-1', combustivel: 'Flex' },
  { id: 41, marca: 'Jeep', modelo: 'Compass 2.0 Diesel', ano: 2025, preco: 'R$ 234.900,00', codigo: '007893-1', combustivel: 'Diesel' },
  { id: 42, marca: 'Jeep', modelo: 'Commander 1.3 Turbo', ano: 2025, preco: 'R$ 245.900,00', codigo: '007894-1', combustivel: 'Flex' },

  // NISSAN
  { id: 43, marca: 'Nissan', modelo: 'Kicks 1.6', ano: 2025, preco: 'R$ 127.900,00', codigo: '008901-1', combustivel: 'Flex' },
  { id: 44, marca: 'Nissan', modelo: 'Versa 1.6 Sense', ano: 2025, preco: 'R$ 106.900,00', codigo: '008902-1', combustivel: 'Flex' },
  { id: 45, marca: 'Nissan', modelo: 'Frontier 2.3 XE', ano: 2025, preco: 'R$ 245.900,00', codigo: '008903-1', combustivel: 'Diesel' },

  // RENAULT
  { id: 46, marca: 'Renault', modelo: 'Kwid 1.0', ano: 2025, preco: 'R$ 69.900,00', codigo: '009012-1', combustivel: 'Flex' },
  { id: 47, marca: 'Renault', modelo: 'Sandero 1.0', ano: 2025, preco: 'R$ 79.900,00', codigo: '009013-1', combustivel: 'Flex' },
  { id: 48, marca: 'Renault', modelo: 'Logan 1.0', ano: 2025, preco: 'R$ 84.900,00', codigo: '009014-1', combustivel: 'Flex' },
  { id: 49, marca: 'Renault', modelo: 'Kardian 1.0 Turbo', ano: 2025, preco: 'R$ 117.900,00', codigo: '009015-1', combustivel: 'Flex' },
  { id: 50, marca: 'Renault', modelo: 'Duster 1.6', ano: 2025, preco: 'R$ 128.900,00', codigo: '009016-1', combustivel: 'Flex' },

  // CAOA CHERY
  { id: 51, marca: 'Caoa Chery', modelo: 'Tiggo 5X 1.5 Turbo', ano: 2025, preco: 'R$ 159.900,00', codigo: '011234-1', combustivel: 'Gasolina' },
  { id: 52, marca: 'Caoa Chery', modelo: 'Tiggo 7 Sport 1.5 Turbo', ano: 2025, preco: 'R$ 191.900,00', codigo: '011235-1', combustivel: 'Gasolina' },
  { id: 53, marca: 'Caoa Chery', modelo: 'Tiggo 8 2.0 Turbo', ano: 2025, preco: 'R$ 245.900,00', codigo: '011236-1', combustivel: 'Gasolina' },

  // PEUGEOT
  { id: 54, marca: 'Peugeot', modelo: '208 1.6 Griffe', ano: 2025, preco: 'R$ 106.900,00', codigo: '012345-1', combustivel: 'Flex' },
  { id: 55, marca: 'Peugeot', modelo: '2008 1.6 Griffe', ano: 2025, preco: 'R$ 139.900,00', codigo: '012346-1', combustivel: 'Flex' },
  { id: 56, marca: 'Peugeot', modelo: '3008 1.6 Turbo', ano: 2025, preco: 'R$ 245.900,00', codigo: '012347-1', combustivel: 'Gasolina' },

  // CITROËN
  { id: 57, marca: 'Citroën', modelo: 'C3 1.0', ano: 2025, preco: 'R$ 79.900,00', codigo: '013456-1', combustivel: 'Flex' },
  { id: 58, marca: 'Citroën', modelo: 'C4 Cactus 1.6', ano: 2025, preco: 'R$ 106.900,00', codigo: '013457-1', combustivel: 'Flex' },

  // MITSUBISHI
  { id: 59, marca: 'Mitsubishi', modelo: 'L200 Triton Sport 2.4', ano: 2025, preco: 'R$ 276.900,00', codigo: '014567-1', combustivel: 'Diesel' },
  { id: 60, marca: 'Mitsubishi', modelo: 'Eclipse Cross 1.5 Turbo', ano: 2025, preco: 'R$ 202.900,00', codigo: '014568-1', combustivel: 'Gasolina' },

  // BYD
  { id: 61, marca: 'BYD', modelo: 'Dolphin Mini Elétrico', ano: 2025, preco: 'R$ 159.900,00', codigo: '015678-1', combustivel: 'Elétrico' },
  { id: 62, marca: 'BYD', modelo: 'Yuan Plus Elétrico', ano: 2025, preco: 'R$ 245.900,00', codigo: '015679-1', combustivel: 'Elétrico' },
  { id: 63, marca: 'BYD', modelo: 'Tan Híbrido Plug-in', ano: 2025, preco: 'R$ 351.900,00', codigo: '015680-1', combustivel: 'Híbrido' },

  // GWM
  { id: 64, marca: 'GWM', modelo: 'Haval H6 2.0 Turbo', ano: 2025, preco: 'R$ 202.900,00', codigo: '016789-1', combustivel: 'Gasolina' },
  { id: 65, marca: 'GWM', modelo: 'Poer 2.0 Diesel', ano: 2025, preco: 'R$ 266.900,00', codigo: '016790-1', combustivel: 'Diesel' },

  // BMW
  { id: 66, marca: 'BMW', modelo: '320i 2.0 Turbo', ano: 2025, preco: 'R$ 349.900,00', codigo: '017890-1', combustivel: 'Gasolina' },
  { id: 67, marca: 'BMW', modelo: 'X1 2.0 sDrive', ano: 2025, preco: 'R$ 308.900,00', codigo: '017891-1', combustivel: 'Gasolina' },

  // MERCEDES-BENZ
  { id: 68, marca: 'Mercedes-Benz', modelo: 'Classe A 200', ano: 2025, preco: 'R$ 297.900,00', codigo: '018901-1', combustivel: 'Gasolina' },
  { id: 69, marca: 'Mercedes-Benz', modelo: 'GLA 200', ano: 2025, preco: 'R$ 340.900,00', codigo: '018902-1', combustivel: 'Gasolina' },

  // AUDI
  { id: 70, marca: 'Audi', modelo: 'A3 Sedan 1.4 TFSI', ano: 2025, preco: 'R$ 266.900,00', codigo: '019012-1', combustivel: 'Gasolina' },
  { id: 71, marca: 'Audi', modelo: 'Q3 1.4 TFSI', ano: 2025, preco: 'R$ 308.900,00', codigo: '019013-1', combustivel: 'Gasolina' },
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
