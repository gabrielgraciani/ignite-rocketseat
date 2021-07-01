import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from 'styled-components';
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../hooks/auth';

import { 
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighlightCards,
  Transactions,
  TransactionsList,
  Title,
  LogoutButton,
  LoadContainer
} from './styles'


import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DataListProps extends TransactionCardProps{
  id: string;
}

interface HighlightProps {
  amount: string;
  lastTransaction: string;
}

interface HighlightData {
  entries: HighlightProps;
  expensives: HighlightProps;
  total: HighlightProps;
}


export function Dashboard () {
  const theme = useTheme()

  const { user, signOut } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData);

  function getLastTransactionDate(collection: DataListProps[], type: 'up'| 'down') {
    
    const collectionFiltered = collection.filter(transaction => transaction.type == type);

    if (collectionFiltered.length == 0)
      return 0

    const lastTransaction = new Date(Math.max.apply(Math, collectionFiltered
        .map(transaction => new Date(transaction.date).getTime()))
    )
      
    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', {
      month: 'long'
    })}`

  }


  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey)
    const transactions = response ? JSON.parse(response) : []

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted : DataListProps[] = transactions.map((item: DataListProps) => {
      
      if (item.type == 'up') {
        entriesTotal += Number(item.amount)
      } else {
        expensiveTotal += Number(item.amount)
      }

      const amount = Number(item.amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })

      const date = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date));
      
      return {
        id: item.id,
        name: item.name,
        amount,
        type: item.type,
        category: item.category,
        date,
      }

    });

    setTransactions(transactionsFormatted.reverse());

    const lastTransactionEntries = getLastTransactionDate(transactions, 'up');
    const lastTransactionExpensives = getLastTransactionDate(transactions, 'down');
    const totalInvertal = lastTransactionExpensives == 0 ? "Não há tansações" : `01 a ${lastTransactionExpensives}`;

    const total = entriesTotal - expensiveTotal;

    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionEntries == 0 ? 'Não há entradas' : `Última entrada dia ${lastTransactionEntries}`
      },
      expensives: {
        amount: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionExpensives == 0 ? 'Não há saídas' : `Última saída dia ${lastTransactionExpensives}`
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInvertal
      },
    })

    setIsLoading(false);
    
  }

  useEffect(() => {
    loadTransactions()
  }, []);

  useFocusEffect(useCallback(() => { 
    loadTransactions() 
  }, []));

  return (

    <Container>
      {
        isLoading ? 
        <LoadContainer > 
          <ActivityIndicator color={theme.colors.primary} size="large" /> 
        </LoadContainer> :
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{uri: user.photo}}/>
                <User>
                  <UserGreeting>Olá, </UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>

              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>

            </UserWrapper>
          </Header>

          <HighlightCards> 
            <HighlightCard 
              title="Entradas" 
              amount={highlightData.entries.amount}
              lastTransaction={highlightData.entries.lastTransaction}
              type="up" 
            />
            <HighlightCard 
              title="Saídas" 
              amount={highlightData.expensives.amount}
              lastTransaction={highlightData.expensives.lastTransaction}
              type="down" 
            />
            <HighlightCard 
              title="Total" 
              amount={highlightData.total.amount}
              lastTransaction={highlightData.total.lastTransaction}
              type="total" 
            />
          </HighlightCards>

          <Transactions>
            <Title>Listagem</Title>

            <TransactionsList 
              data={transactions}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />

          </Transactions>
        </>
      }
    </Container>

  );

};